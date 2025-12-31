// CORS headers with rate limiting support
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Rate limiting configuration (per minute)
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60; // seconds

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
  // Use IP or authorization header as key
  const auth = req.headers.get('authorization') || '';
  const forwarded = req.headers.get('x-forwarded-for') || 'unknown';
  return `${forwarded}-${auth.slice(0, 20)}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 };
  }
  
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// Get rate limit headers for response
function getRateLimitHeaders(req: Request): Record<string, string> {
  const key = getRateLimitKey(req);
  const { remaining, resetAt } = checkRateLimit(key);
  
  return {
    'X-RateLimit-Limit': RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
  };
}

export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const rateLimitHeaders = req ? getRateLimitHeaders(req) : {};
  
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      ...corsHeaders, 
      ...rateLimitHeaders,
      'Content-Type': 'application/json' 
    },
  });
}

export function errorResponse(message: string, status = 400, req?: Request): Response {
  const rateLimitHeaders = req ? getRateLimitHeaders(req) : {};
  
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 
      ...corsHeaders, 
      ...rateLimitHeaders,
      'Content-Type': 'application/json' 
    },
  });
}

// Check and enforce rate limit - returns error response if limit exceeded
export function checkAndEnforceRateLimit(req: Request): Response | null {
  const key = getRateLimitKey(req);
  const { allowed, remaining, resetAt } = checkRateLimit(key);
  
  if (!allowed) {
    return new Response(JSON.stringify({ 
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000)
    }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
      },
    });
  }
  
  return null;
}

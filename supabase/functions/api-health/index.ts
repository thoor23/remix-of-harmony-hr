import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-health', '');
  const method = req.method;

  console.log(`[api-health] ${method} ${path}`);

  try {
    const startTime = Date.now();

    // GET / or /health - Basic health check
    if (method === 'GET' && (path === '' || path === '/')) {
      return jsonResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'hrms-api',
      });
    }

    // GET /ready - Readiness probe (checks database connection)
    if (method === 'GET' && path === '/ready') {
      const supabase = getSupabaseClient();
      
      // Test database connection
      const { error: dbError } = await supabase
        .from('departments')
        .select('id')
        .limit(1);

      if (dbError) {
        return jsonResponse({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: { status: 'unhealthy', error: dbError.message }
          }
        }, 503);
      }

      return jsonResponse({
        status: 'ready',
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - startTime,
        checks: {
          database: { status: 'healthy' }
        }
      });
    }

    // GET /live - Liveness probe
    if (method === 'GET' && path === '/live') {
      return jsonResponse({
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    }

    // GET /metrics - Performance metrics (internal use)
    if (method === 'GET' && path === '/metrics') {
      const supabase = getSupabaseClient();
      
      // Get some basic counts
      const [
        { count: employeeCount },
        { count: attendanceCount },
        { count: leaveCount },
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('attendance_records').select('*', { count: 'exact', head: true }),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }),
      ]);

      return jsonResponse({
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - startTime,
        metrics: {
          total_employees: employeeCount || 0,
          total_attendance_records: attendanceCount || 0,
          total_leave_requests: leaveCount || 0,
        }
      });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-health] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, DEFAULT_COMPANY_ID } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

// List of services to check
const SERVICES = {
  core: [
    { name: 'API Gateway', endpoint: 'api-health', path: '' },
    { name: 'Database', endpoint: 'api-health', path: '/ready' },
    { name: 'Authentication', endpoint: 'api-auth', path: '' },
  ],
  business: [
    { name: 'Employee Management', endpoint: 'api-employees', path: '' },
    { name: 'Attendance System', endpoint: 'api-attendance', path: '' },
    { name: 'Leave Management', endpoint: 'api-leaves', path: '' },
    { name: 'Payroll Service', endpoint: 'api-payroll', path: '' },
    { name: 'Shift Management', endpoint: 'api-shifts', path: '' },
    { name: 'Asset Management', endpoint: 'api-assets', path: '' },
  ],
  support: [
    { name: 'Notifications', endpoint: 'api-notifications', path: '' },
    { name: 'Helpdesk', endpoint: 'api-helpdesk', path: '' },
    { name: 'Search Service', endpoint: 'api-search', path: '' },
    { name: 'Documents', endpoint: 'api-documents', path: '' },
  ],
};

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime: number;
  error?: string;
}

async function checkService(baseUrl: string, service: { name: string; endpoint: string; path: string }): Promise<ServiceStatus> {
  const startTime = Date.now();
  const url = `${baseUrl}/${service.endpoint}${service.path}`;
  
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  try {
    const controller = new AbortController();
    // Increased timeout to 10s to handle cold starts
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey || '',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 401 || response.status === 403) {
      // Mark as degraded if response time exceeds 5s (accounting for cold starts)
      return {
        name: service.name,
        status: responseTime > 5000 ? 'degraded' : 'operational',
        responseTime,
      };
    } else if (response.status === 404) {
      return {
        name: service.name,
        status: 'degraded',
        responseTime,
        error: 'Endpoint not found',
      };
    } else {
      return {
        name: service.name,
        status: 'degraded',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: service.name,
      status: 'outage',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

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

    // GET /services - Check all services status
    if (method === 'GET' && path === '/services') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (!supabaseUrl) {
        return errorResponse('SUPABASE_URL not configured', 500);
      }
      
      const baseUrl = `${supabaseUrl}/functions/v1`;
      
      const [coreResults, businessResults, supportResults] = await Promise.all([
        Promise.all(SERVICES.core.map(s => checkService(baseUrl, s))),
        Promise.all(SERVICES.business.map(s => checkService(baseUrl, s))),
        Promise.all(SERVICES.support.map(s => checkService(baseUrl, s))),
      ]);
      
      const allServices = [...coreResults, ...businessResults, ...supportResults];
      
      const hasOutage = allServices.some(s => s.status === 'outage');
      const hasDegraded = allServices.some(s => s.status === 'degraded');
      
      let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';
      if (hasOutage) {
        overallStatus = 'outage';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      }
      
      // Log status to history with company_id
      const supabase = getSupabaseClient();
      const historyRecords = [
        ...coreResults.map(s => ({ 
          service_name: s.name, 
          service_group: 'core', 
          status: s.status, 
          response_time_ms: s.responseTime,
          company_id: DEFAULT_COMPANY_ID 
        })),
        ...businessResults.map(s => ({ 
          service_name: s.name, 
          service_group: 'business', 
          status: s.status, 
          response_time_ms: s.responseTime,
          company_id: DEFAULT_COMPANY_ID 
        })),
        ...supportResults.map(s => ({ 
          service_name: s.name, 
          service_group: 'support', 
          status: s.status, 
          response_time_ms: s.responseTime,
          company_id: DEFAULT_COMPANY_ID 
        })),
      ];
      
      supabase.from('status_history').insert(historyRecords).then(({ error }) => {
        if (error) {
          console.error('[api-health] Failed to log status history:', error);
        } else {
          console.log('[api-health] Logged', historyRecords.length, 'status records');
        }
      });
      
      return jsonResponse({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - startTime,
        services: {
          core: coreResults,
          business: businessResults,
          support: supportResults,
        },
        summary: {
          total: allServices.length,
          operational: allServices.filter(s => s.status === 'operational').length,
          degraded: allServices.filter(s => s.status === 'degraded').length,
          outage: allServices.filter(s => s.status === 'outage').length,
        },
      });
    }

    // GET /metrics - Performance metrics
    if (method === 'GET' && path === '/metrics') {
      const supabase = getSupabaseClient();
      
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

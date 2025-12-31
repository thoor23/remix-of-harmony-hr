import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/auth.ts';
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
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name: service.name,
        status: responseTime > 2000 ? 'degraded' : 'operational',
        responseTime,
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

    // GET /services - Check all services status
    if (method === 'GET' && path === '/services') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (!supabaseUrl) {
        return errorResponse('SUPABASE_URL not configured', 500);
      }
      
      const baseUrl = `${supabaseUrl}/functions/v1`;
      
      // Check all services in parallel
      const [coreResults, businessResults, supportResults] = await Promise.all([
        Promise.all(SERVICES.core.map(s => checkService(baseUrl, s))),
        Promise.all(SERVICES.business.map(s => checkService(baseUrl, s))),
        Promise.all(SERVICES.support.map(s => checkService(baseUrl, s))),
      ]);
      
      const allServices = [...coreResults, ...businessResults, ...supportResults];
      
      // Calculate overall status
      const hasOutage = allServices.some(s => s.status === 'outage');
      const hasDegraded = allServices.some(s => s.status === 'degraded');
      
      let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';
      if (hasOutage) {
        overallStatus = 'outage';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      }
      
      // Log status to history (async, don't wait)
      const supabase = getSupabaseClient();
      const historyRecords = [
        ...coreResults.map(s => ({ service_name: s.name, service_group: 'core', status: s.status, response_time_ms: s.responseTime })),
        ...businessResults.map(s => ({ service_name: s.name, service_group: 'business', status: s.status, response_time_ms: s.responseTime })),
        ...supportResults.map(s => ({ service_name: s.name, service_group: 'support', status: s.status, response_time_ms: s.responseTime })),
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StatusHistoryRecord {
  id: string;
  service_name: string;
  service_group: string;
  status: 'operational' | 'degraded' | 'outage';
  response_time_ms: number;
  checked_at: string;
}

export interface StatusIncident {
  id: string;
  title: string;
  description: string | null;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
}

export interface DailyUptime {
  date: string;
  uptimePercent: number;
  status: 'operational' | 'degraded' | 'outage';
  checkCount: number;
}

export interface StatusHistoryData {
  dailyUptime: DailyUptime[];
  incidents: StatusIncident[];
  overallUptime: number;
}

async function fetchStatusHistory(days: number): Promise<StatusHistoryData> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch status history
  const { data: historyData, error: historyError } = await supabase
    .from('status_history')
    .select('*')
    .gte('checked_at', startDate.toISOString())
    .order('checked_at', { ascending: true });

  if (historyError) {
    console.error('Error fetching status history:', historyError);
  }

  // Fetch incidents
  const { data: incidentsData, error: incidentsError } = await supabase
    .from('status_incidents')
    .select('*')
    .gte('started_at', startDate.toISOString())
    .order('started_at', { ascending: false });

  if (incidentsError) {
    console.error('Error fetching incidents:', incidentsError);
  }

  // Process history into daily uptime
  const history = (historyData || []) as StatusHistoryRecord[];
  const incidents = (incidentsData || []) as StatusIncident[];

  // Group by date
  const dailyMap = new Map<string, { operational: number; total: number }>();

  history.forEach((record) => {
    const date = record.checked_at.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { operational: 0, total: 0 });
    }
    const day = dailyMap.get(date)!;
    day.total++;
    if (record.status === 'operational') {
      day.operational++;
    }
  });

  // Fill in missing days
  const dailyUptime: DailyUptime[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = dailyMap.get(dateStr);
    if (dayData && dayData.total > 0) {
      const uptimePercent = (dayData.operational / dayData.total) * 100;
      dailyUptime.push({
        date: dateStr,
        uptimePercent,
        status: uptimePercent >= 99 ? 'operational' : uptimePercent >= 95 ? 'degraded' : 'outage',
        checkCount: dayData.total,
      });
    } else {
      // No data for this day - assume operational (no issues reported)
      dailyUptime.push({
        date: dateStr,
        uptimePercent: 100,
        status: 'operational',
        checkCount: 0,
      });
    }
  }

  // Calculate overall uptime
  const totalChecks = history.length;
  const operationalChecks = history.filter(h => h.status === 'operational').length;
  const overallUptime = totalChecks > 0 ? (operationalChecks / totalChecks) * 100 : 100;

  return {
    dailyUptime,
    incidents,
    overallUptime,
  };
}

export function useStatusHistory(days: number = 90) {
  return useQuery({
    queryKey: ['status-history', days],
    queryFn: () => fetchStatusHistory(days),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });
}

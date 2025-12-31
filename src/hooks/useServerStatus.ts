import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime: number;
  error?: string;
}

export interface ServerStatusResponse {
  status: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  latency_ms: number;
  services: {
    core: ServiceStatus[];
    business: ServiceStatus[];
    support: ServiceStatus[];
  };
  summary: {
    total: number;
    operational: number;
    degraded: number;
    outage: number;
  };
}

async function fetchServerStatus(): Promise<ServerStatusResponse> {
  const { data, error } = await supabase.functions.invoke('api-health/services', {
    method: 'GET',
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch server status');
  }

  return data as ServerStatusResponse;
}

export function useServerStatus(refetchInterval = 30000) {
  return useQuery({
    queryKey: ['server-status'],
    queryFn: fetchServerStatus,
    refetchInterval,
    staleTime: 10000,
    retry: 1,
  });
}

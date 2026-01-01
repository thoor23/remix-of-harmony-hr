import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyId } from "@/lib/supabase-helpers";

interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  performed_by: string | null;
  performer_name: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AuditLogFilters {
  action?: string;
  module?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.action && filters.action !== "all") {
        query = query.eq('action', filters.action);
      }
      if (filters?.module && filters.module !== "all") {
        query = query.eq('module', filters.module);
      }
      if (filters?.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AuditLog[];
    },
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      module,
      description,
      metadata = {},
    }: {
      action: string;
      module: string;
      description: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      
      // Get performer name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const performerName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email 
        : user.email;

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          action,
          module,
          description,
          metadata: metadata as any,
          performed_by: user.id,
          performer_name: performerName,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: (error: Error) => {
      console.error("Failed to create audit log:", error.message);
    },
  });
}

export async function logAuditEvent(
  action: string,
  module: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No user for audit log');
      return;
    }

    const companyId = await getCompanyId(user.id);
    
    // Get performer name from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const performerName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email 
      : user.email;

    await supabase
      .from('audit_logs')
      .insert([{
        action,
        module,
        description,
        metadata: metadata as any,
        performed_by: user.id,
        performer_name: performerName,
        company_id: companyId,
      }]);
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

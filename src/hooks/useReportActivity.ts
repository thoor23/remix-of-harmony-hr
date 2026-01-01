import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

export interface ReportActivity {
  id: string;
  action: string;
  description: string;
  performer_name: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function useReportActivity() {
  return useQuery({
    queryKey: ["report-activity"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .eq('module', 'reports')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as ReportActivity[];
    },
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: ["report-stats"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) {
        return {
          reportsGenerated: 0,
          scheduledReports: 0,
          totalDownloads: 0,
          monthlyGrowth: '0',
        };
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .eq('module', 'reports');

      if (error) throw error;
      
      const logs = data || [];
      
      // Calculate stats from audit logs
      const totalExports = logs.filter(l => l.action.includes('export')).length;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyExports = logs.filter(l => 
        l.action.includes('export') && 
        new Date(l.created_at || '') >= thisMonth
      ).length;

      return {
        reportsGenerated: totalExports,
        scheduledReports: 0, // Not implemented yet
        totalDownloads: totalExports,
        monthlyGrowth: monthlyExports > 0 ? '+' + monthlyExports : '0',
      };
    },
  });
}

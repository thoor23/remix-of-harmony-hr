import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
      const data = await api.get<ReportActivity[]>("/audit?module=reports&limit=10");
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: ["report-stats"],
    queryFn: async () => {
      // Get count of report-related audit logs
      const data = await api.get<ReportActivity[]>("/audit?module=reports");
      const logs = Array.isArray(data) ? data : [];
      
      // Calculate stats from audit logs
      const totalExports = logs.filter(l => l.action.includes('export')).length;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyExports = logs.filter(l => 
        l.action.includes('export') && 
        new Date(l.created_at) >= thisMonth
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

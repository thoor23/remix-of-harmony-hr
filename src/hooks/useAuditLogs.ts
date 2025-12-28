import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  performed_by: string | null;
  performer_name: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
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
      const params = new URLSearchParams();
      if (filters?.action && filters.action !== "all") params.append("action", filters.action);
      if (filters?.module && filters.module !== "all") params.append("module", filters.module);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);

      const queryString = params.toString();
      return api.get<AuditLog[]>(`/audit${queryString ? `?${queryString}` : ""}`);
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
      return api.post("/audit", { action, module, description, metadata });
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
    await api.post("/audit", { action, module, description, metadata });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

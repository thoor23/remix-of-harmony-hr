import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  performed_by: string | null;
  performer_name: string | null;
  ip_address: string | null;
  metadata: Json;
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
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", filters.action);
      }

      if (filters?.module && filters.module !== "all") {
        query = query.eq("module", filters.module);
      }

      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
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
      metadata?: Json;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // Get user's profile name
      let performerName = user?.email || "System";
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          performerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.email || "System";
        }
      }

      const { error } = await supabase.from("audit_logs").insert([{
        action,
        module,
        description,
        performed_by: user?.id || null,
        performer_name: performerName,
        metadata,
      }]);

      if (error) throw error;
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
  metadata: Json = {}
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    let performerName = user?.email || "System";
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        performerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.email || "System";
      }
    }

    await supabase.from("audit_logs").insert([{
      action,
      module,
      description,
      performed_by: user?.id || null,
      performer_name: performerName,
      metadata,
    }]);
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

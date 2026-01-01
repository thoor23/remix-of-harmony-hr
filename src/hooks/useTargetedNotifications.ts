import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

export interface TargetedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  target_type: string;
  target_ids: string[];
  sent_by: string;
  sent_at: string;
  created_at: string;
}

export interface SendTargetedNotificationData {
  title: string;
  message: string;
  type: string;
  priority: string;
  target_type: 'all' | 'department' | 'employees';
  target_ids: string[];
}

export function useTargetedNotifications() {
  return useQuery({
    queryKey: ["targeted-notifications"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('targeted_notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TargetedNotification[];
    },
  });
}

export function useSendTargetedNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendTargetedNotificationData) => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) throw new Error("Company not found");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from('targeted_notifications')
        .insert({
          company_id: companyId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          target_type: data.target_type,
          target_ids: data.target_ids,
          sent_by: user.id,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Count recipients based on target type
      let recipientCount = 0;
      if (data.target_type === 'all') {
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active');
        recipientCount = count || 0;
      } else if (data.target_type === 'employees') {
        recipientCount = data.target_ids.length;
      } else if (data.target_type === 'department') {
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active')
          .in('department_id', data.target_ids);
        recipientCount = count || 0;
      }

      return { targetedNotification: result, recipientCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["targeted-notifications"] });
      toast.success(`Notification sent to ${result.recipientCount} recipient(s)`);
    },
    onError: (error: Error) => {
      console.error("Failed to send notification:", error);
      toast.error("Failed to send notification");
    },
  });
}

export function useDeleteTargetedNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('targeted_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targeted-notifications"] });
      toast.success("Notification record deleted");
    },
    onError: (error: Error) => {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    },
  });
}

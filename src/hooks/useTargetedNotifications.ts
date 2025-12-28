import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase
        .from("targeted_notifications")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data as TargetedNotification[];
    },
  });
}

export function useSendTargetedNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendTargetedNotificationData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Insert targeted notification record
      const { data: targetedNotification, error: insertError } = await supabase
        .from("targeted_notifications")
        .insert({
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          target_type: data.target_type,
          target_ids: data.target_ids,
          sent_by: userData.user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get user IDs based on target type
      let userIds: string[] = [];

      if (data.target_type === 'all') {
        // Get all active employee user IDs
        const { data: employees, error: empError } = await supabase
          .from("employees")
          .select("user_id")
          .eq("status", "active")
          .not("user_id", "is", null);

        if (empError) throw empError;
        userIds = employees?.map(e => e.user_id).filter(Boolean) as string[] || [];
      } else if (data.target_type === 'department') {
        // Get user IDs for employees in selected departments
        const { data: deptUserIds, error: deptError } = await supabase
          .rpc("get_department_employee_user_ids", { department_ids: data.target_ids });

        if (deptError) throw deptError;
        userIds = deptUserIds?.map((r: { user_id: string }) => r.user_id) || [];
      } else if (data.target_type === 'employees') {
        // Get user IDs for selected employees
        const { data: empUserIds, error: empError } = await supabase
          .rpc("get_employee_user_ids", { employee_ids: data.target_ids });

        if (empError) throw empError;
        userIds = empUserIds?.map((r: { user_id: string }) => r.user_id) || [];
      }

      // Create notifications for all target users
      if (userIds.length > 0) {
        const notifications = userIds.map(userId => ({
          user_id: userId,
          title: data.title,
          message: data.message,
          type: data.type,
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notifError) throw notifError;
      }

      return { targetedNotification, recipientCount: userIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["targeted-notifications"] });
      toast.success(`Notification sent to ${result.recipientCount} recipient(s)`);
    },
    onError: (error) => {
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
        .from("targeted_notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targeted-notifications"] });
      toast.success("Notification record deleted");
    },
    onError: (error) => {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    },
  });
}

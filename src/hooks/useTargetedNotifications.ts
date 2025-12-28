import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

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
      return api.get<TargetedNotification[]>("/notifications/targeted");
    },
  });
}

export function useSendTargetedNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendTargetedNotificationData) => {
      return api.post<{ targetedNotification: TargetedNotification; recipientCount: number }>(
        "/notifications/targeted",
        data
      );
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
      return api.delete(`/notifications/targeted/${id}`);
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

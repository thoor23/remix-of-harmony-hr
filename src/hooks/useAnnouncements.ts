import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  published_at: string;
  is_active: boolean | null;
  created_by: string;
  created_at: string;
  scheduled_at: string | null;
  expires_at: string | null;
  banner_template_id: string | null;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<Announcement[]>('/announcements'),
  });
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  scheduled_at?: string | null;
  expires_at?: string | null;
  banner_template_id?: string | null;
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (announcement: CreateAnnouncementData) => {
      if (!user?.id) throw new Error("Not authenticated");
      await api.post('/announcements', {
        ...announcement,
        created_by: user.id,
        is_active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create announcement: ${error.message}`);
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string;
      title?: string;
      content?: string;
      type?: string;
      priority?: string;
      target_audience?: string;
      is_active?: boolean;
      scheduled_at?: string | null;
      expires_at?: string | null;
      banner_template_id?: string | null;
    }) => {
      await api.put(`/announcements/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update announcement: ${error.message}`);
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete announcement: ${error.message}`);
    },
  });
}

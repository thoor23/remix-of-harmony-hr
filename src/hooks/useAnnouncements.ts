import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";

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
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Announcement[];
    },
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

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('announcements')
        .insert([{
          ...announcement,
          created_by: user.id,
          company_id: companyId,
          is_active: true,
        }]);

      if (error) throw error;
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
      const { error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
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

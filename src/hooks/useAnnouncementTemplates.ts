import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AnnouncementTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  is_default: boolean | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementTemplateData {
  name: string;
  title: string;
  content: string;
  type?: string;
  priority?: string;
  target_audience?: string;
  is_default?: boolean;
}

export const useAnnouncementTemplates = () => {
  return useQuery({
    queryKey: ["announcement-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as AnnouncementTemplate[];
    },
  });
};

export const useCreateAnnouncementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateAnnouncementTemplateData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("announcement_templates")
        .insert({
          ...templateData,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
      toast.success("Template saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });
};

export const useUpdateAnnouncementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<AnnouncementTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("announcement_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
      toast.success("Template updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });
};

export const useDeleteAnnouncementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcement_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete template: " + error.message);
    },
  });
};

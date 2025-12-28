import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Banner placeholder constants
export const BANNER_PLACEHOLDERS = [
  { key: "{{title}}", label: "Title", description: "Announcement title" },
  { key: "{{content}}", label: "Content", description: "Announcement content/message" },
  { key: "{{priority}}", label: "Priority", description: "Priority label (Low/Medium/High)" },
  { key: "{{type}}", label: "Type", description: "Type label (General/Urgent/Event/Policy)" },
  { key: "{{type_icon}}", label: "Type Icon", description: "Emoji icon based on type" },
  { key: "{{time_remaining}}", label: "Time Remaining", description: "Countdown (e.g., 2d 5h left)" },
  { key: "{{expires_at}}", label: "Expires At", description: "Expiry date formatted" },
  { key: "{{published_at}}", label: "Published At", description: "Published date formatted" },
  { key: "{{priority_color}}", label: "Priority Color", description: "Text color based on priority" },
  { key: "{{priority_bg}}", label: "Priority Background", description: "Background color based on priority" },
  { key: "{{priority_border}}", label: "Priority Border", description: "Border color based on priority" },
];

export const PRIORITY_TYPES = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low Priority Only" },
  { value: "medium", label: "Medium Priority Only" },
  { value: "high", label: "High Priority Only" },
];

export const DEFAULT_BANNER_HTML = `<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px; border-radius: 8px; border: 1px solid {{priority_border}}; background: {{priority_bg}};">
  <div style="display: flex; align-items: flex-start; gap: 12px;">
    <span style="font-size: 20px;">{{type_icon}}</span>
    <div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <p style="font-weight: 600; font-size: 14px; margin: 0; color: {{priority_color}};">{{title}}</p>
        <span style="font-size: 12px; color: {{priority_color}}; opacity: 0.7; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 999px;">{{time_remaining}}</span>
      </div>
      <p style="font-size: 14px; color: {{priority_color}}; opacity: 0.85; margin: 4px 0 0 0;">{{content}}</p>
    </div>
  </div>
</div>`;

export interface BannerTemplate {
  id: string;
  name: string;
  html_content: string;
  priority_type: string;
  is_default: boolean | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerTemplateData {
  name: string;
  html_content: string;
  priority_type?: string;
  is_default?: boolean;
}

// Fetch all banner templates
export function useBannerTemplates() {
  return useQuery({
    queryKey: ["banner-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_banner_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BannerTemplate[];
    },
  });
}

// Fetch default banner template
export function useDefaultBannerTemplate(priority?: string) {
  return useQuery({
    queryKey: ["default-banner-template", priority],
    queryFn: async () => {
      // First try to find a template for the specific priority
      if (priority) {
        const { data: priorityTemplate } = await supabase
          .from("announcement_banner_templates")
          .select("*")
          .eq("is_active", true)
          .eq("priority_type", priority)
          .eq("is_default", true)
          .single();

        if (priorityTemplate) return priorityTemplate as BannerTemplate;
      }

      // Fall back to the "all" priority default template
      const { data, error } = await supabase
        .from("announcement_banner_templates")
        .select("*")
        .eq("is_active", true)
        .eq("priority_type", "all")
        .eq("is_default", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as BannerTemplate | null;
    },
  });
}

// Create banner template
export function useCreateBannerTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateBannerTemplateData) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("announcement_banner_templates")
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
      queryClient.invalidateQueries({ queryKey: ["banner-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-banner-template"] });
      toast.success("Banner template created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create banner template: " + error.message);
    },
  });
}

// Update banner template
export function useUpdateBannerTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...templateData }: { id: string } & Partial<CreateBannerTemplateData>) => {
      const { data, error } = await supabase
        .from("announcement_banner_templates")
        .update(templateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-banner-template"] });
      toast.success("Banner template updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update banner template: " + error.message);
    },
  });
}

// Delete banner template
export function useDeleteBannerTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcement_banner_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-banner-template"] });
      toast.success("Banner template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete banner template: " + error.message);
    },
  });
}

// Set default banner template
export function useSetDefaultBannerTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, priorityType }: { id: string; priorityType: string }) => {
      // First, unset all defaults for this priority type
      await supabase
        .from("announcement_banner_templates")
        .update({ is_default: false })
        .eq("priority_type", priorityType);

      // Then set the new default
      const { error } = await supabase
        .from("announcement_banner_templates")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-banner-template"] });
      toast.success("Default template updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to set default: " + error.message);
    },
  });
}

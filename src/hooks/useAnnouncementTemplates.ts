import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

// Constants for announcement templates
export const ANNOUNCEMENT_TYPES = [
  { value: "general", label: "General" },
  { value: "urgent", label: "Urgent" },
  { value: "event", label: "Event" },
  { value: "policy", label: "Policy Update" },
  { value: "holiday", label: "Holiday Notice" },
  { value: "maintenance", label: "Maintenance" },
];

export const ANNOUNCEMENT_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const ANNOUNCEMENT_AUDIENCES = [
  { value: "all", label: "All Employees" },
  { value: "department", label: "Specific Department" },
  { value: "managers", label: "Managers Only" },
  { value: "hr", label: "HR Team" },
];

export const ANNOUNCEMENT_PLACEHOLDERS = {
  company: [
    { value: "{{company_name}}", label: "Company Name" },
    { value: "{{company_address}}", label: "Company Address" },
    { value: "{{company_phone}}", label: "Company Phone" },
    { value: "{{company_email}}", label: "Company Email" },
    { value: "{{company_website}}", label: "Company Website" },
  ],
  dates: [
    { value: "{{current_date}}", label: "Current Date" },
    { value: "{{current_time}}", label: "Current Time" },
    { value: "{{current_year}}", label: "Current Year" },
  ],
  announcement: [
    { value: "{{announcement_title}}", label: "Announcement Title" },
    { value: "{{announcement_type}}", label: "Announcement Type" },
    { value: "{{announcement_priority}}", label: "Priority Level" },
  ],
};

export const DEFAULT_ANNOUNCEMENT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">{{company_name}}</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">{{announcement_type}} Announcement</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 25px; border: 1px solid #e9ecef; border-top: none;">
    <h2 style="color: #333; margin-top: 0;">{{announcement_title}}</h2>
    
    <p style="color: #555; line-height: 1.6;">
      Dear Team,
    </p>
    
    <p style="color: #555; line-height: 1.6;">
      [Your announcement content goes here. Replace this placeholder with your actual message.]
    </p>
    
    <p style="color: #555; line-height: 1.6;">
      Best regards,<br/>
      HR Department
    </p>
  </div>
  
  <div style="background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">{{company_name}} | {{company_address}}</p>
    <p style="margin: 5px 0 0 0;">{{current_date}}</p>
  </div>
</div>`;

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
      return api.get<AnnouncementTemplate[]>("/templates/announcements");
    },
  });
};

export const useCreateAnnouncementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateAnnouncementTemplateData) => {
      return api.post<AnnouncementTemplate>("/templates/announcements", templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
      toast.success("Template saved successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });
};

export const useUpdateAnnouncementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<AnnouncementTemplate> & { id: string }) => {
      return api.patch<AnnouncementTemplate>(`/templates/announcements/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
      toast.success("Template updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });
};

export const useDeleteAnnouncementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/templates/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete template: " + error.message);
    },
  });
};

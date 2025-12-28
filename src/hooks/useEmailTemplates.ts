import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";

export type EmailTemplateType = 
  | "leave_request_new" 
  | "leave_approved" 
  | "leave_rejected" 
  | "ticket_new" 
  | "ticket_resolved" 
  | "attendance_late"
  | "payslip_generated" 
  | "announcement_new" 
  | "welcome_employee";

export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailTemplateType;
  subject: string;
  content: string;
  placeholders: string[];
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Email template types with labels
export const EMAIL_TEMPLATE_TYPES: { value: EmailTemplateType; label: string; category: string }[] = [
  { value: "leave_request_new", label: "Leave Request Submitted", category: "Leave" },
  { value: "leave_approved", label: "Leave Approved", category: "Leave" },
  { value: "leave_rejected", label: "Leave Rejected", category: "Leave" },
  { value: "ticket_new", label: "New Helpdesk Ticket", category: "Helpdesk" },
  { value: "ticket_resolved", label: "Ticket Resolved", category: "Helpdesk" },
  { value: "attendance_late", label: "Late Check-in Alert", category: "Attendance" },
  { value: "payslip_generated", label: "Payslip Generated", category: "Payroll" },
  { value: "announcement_new", label: "New Announcement", category: "General" },
  { value: "welcome_employee", label: "Welcome New Employee", category: "General" },
];

// Available placeholders for email templates
export const EMAIL_PLACEHOLDERS = {
  general: [
    { key: "{{recipient_name}}", label: "Recipient Name" },
    { key: "{{recipient_email}}", label: "Recipient Email" },
    { key: "{{company_name}}", label: "Company Name" },
    { key: "{{app_url}}", label: "Application URL" },
    { key: "{{current_date}}", label: "Current Date" },
  ],
  leave: [
    { key: "{{employee_name}}", label: "Employee Name" },
    { key: "{{leave_type}}", label: "Leave Type" },
    { key: "{{start_date}}", label: "Start Date" },
    { key: "{{end_date}}", label: "End Date" },
    { key: "{{days}}", label: "Number of Days" },
    { key: "{{reason}}", label: "Reason" },
    { key: "{{status}}", label: "Status" },
    { key: "{{approved_by}}", label: "Approved By" },
    { key: "{{comments}}", label: "Comments" },
  ],
  helpdesk: [
    { key: "{{ticket_subject}}", label: "Ticket Subject" },
    { key: "{{ticket_category}}", label: "Category" },
    { key: "{{ticket_priority}}", label: "Priority" },
    { key: "{{ticket_status}}", label: "Status" },
    { key: "{{ticket_description}}", label: "Description" },
    { key: "{{priority_color}}", label: "Priority Color" },
  ],
  payroll: [
    { key: "{{pay_period}}", label: "Pay Period" },
    { key: "{{net_pay}}", label: "Net Pay" },
    { key: "{{pay_date}}", label: "Pay Date" },
  ],
  announcement: [
    { key: "{{announcement_title}}", label: "Announcement Title" },
    { key: "{{announcement_content}}", label: "Announcement Content" },
  ],
  welcome: [
    { key: "{{temp_password}}", label: "Temporary Password" },
  ],
};

export function useEmailTemplates(type?: EmailTemplateType) {
  return useQuery({
    queryKey: ["email-templates", type],
    queryFn: async () => {
      let query = supabase
        .from("email_templates")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: ["email-template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EmailTemplate;
    },
    enabled: !!id,
  });
}

export function useEmailTemplateByType(type: EmailTemplateType) {
  return useQuery({
    queryKey: ["email-template-by-type", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .eq("is_default", true)
        .maybeSingle();

      if (error) throw error;
      
      // If no default, get any active template of this type
      if (!data) {
        const { data: fallback, error: fallbackError } = await supabase
          .from("email_templates")
          .select("*")
          .eq("type", type)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        
        if (fallbackError) throw fallbackError;
        return fallback as EmailTemplate | null;
      }
      
      return data as EmailTemplate;
    },
    enabled: !!type,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      type,
      subject,
      content,
      placeholders = [],
      is_default = false,
    }: {
      name: string;
      type: EmailTemplateType;
      subject: string;
      content: string;
      placeholders?: string[];
      is_default?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      // If setting as default, unset other defaults of same type
      if (is_default) {
        await supabase
          .from("email_templates")
          .update({ is_default: false })
          .eq("type", type);
      }

      const { data, error } = await supabase
        .from("email_templates")
        .insert([{
          name,
          type,
          subject,
          content,
          placeholders,
          is_default,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent("CREATE", "Email Templates", `Created template: ${name}`, { template_id: data.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Email template created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      type,
      subject,
      content,
      placeholders,
      is_default,
      is_active,
    }: {
      id: string;
      name?: string;
      type?: EmailTemplateType;
      subject?: string;
      content?: string;
      placeholders?: string[];
      is_default?: boolean;
      is_active?: boolean;
    }) => {
      // If setting as default, unset other defaults of same type
      if (is_default && type) {
        await supabase
          .from("email_templates")
          .update({ is_default: false })
          .eq("type", type);
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (subject !== undefined) updateData.subject = subject;
      if (content !== undefined) updateData.content = content;
      if (placeholders !== undefined) updateData.placeholders = placeholders;
      if (is_default !== undefined) updateData.is_default = is_default;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from("email_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent("UPDATE", "Email Templates", `Updated template: ${data.name}`, { template_id: id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["email-template"] });
      queryClient.invalidateQueries({ queryKey: ["email-template-by-type"] });
      toast.success("Email template updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await logAuditEvent("DELETE", "Email Templates", `Deleted template: ${name}`, { template_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Email template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

// Get placeholders relevant to a template type
export function getPlaceholdersForType(type: EmailTemplateType): { key: string; label: string }[] {
  const placeholders = [...EMAIL_PLACEHOLDERS.general];
  
  if (type.startsWith("leave_")) {
    placeholders.push(...EMAIL_PLACEHOLDERS.leave);
  } else if (type.startsWith("ticket_")) {
    placeholders.push(...EMAIL_PLACEHOLDERS.helpdesk);
  } else if (type === "payslip_generated") {
    placeholders.push(...EMAIL_PLACEHOLDERS.payroll);
  } else if (type === "announcement_new") {
    placeholders.push(...EMAIL_PLACEHOLDERS.announcement);
  } else if (type === "welcome_employee") {
    placeholders.push(...EMAIL_PLACEHOLDERS.welcome);
  }
  
  return placeholders;
}

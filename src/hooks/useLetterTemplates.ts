import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";

export type LetterType = "offer" | "experience" | "relieving" | "increment" | "custom";

export interface LetterTemplate {
  id: string;
  name: string;
  type: LetterType;
  content: string;
  placeholders: string[];
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Available placeholders for letter templates
export const LETTER_PLACEHOLDERS = {
  employee: [
    { key: "{{employee_name}}", label: "Employee Name" },
    { key: "{{employee_id}}", label: "Employee ID" },
    { key: "{{designation}}", label: "Designation" },
    { key: "{{department}}", label: "Department" },
    { key: "{{date_of_joining}}", label: "Date of Joining" },
    { key: "{{email}}", label: "Email" },
  ],
  company: [
    { key: "{{company_logo}}", label: "Company Logo" },
    { key: "{{company_name}}", label: "Company Name" },
    { key: "{{company_address}}", label: "Company Address" },
    { key: "{{hr_name}}", label: "HR Name" },
    { key: "{{hr_designation}}", label: "HR Designation" },
  ],
  offer: [
    { key: "{{offered_salary}}", label: "Offered Salary" },
    { key: "{{start_date}}", label: "Start Date" },
    { key: "{{offered_designation}}", label: "Offered Designation" },
  ],
  experience: [
    { key: "{{last_working_day}}", label: "Last Working Day" },
    { key: "{{tenure}}", label: "Tenure" },
  ],
  relieving: [
    { key: "{{last_working_day}}", label: "Last Working Day" },
    { key: "{{resignation_date}}", label: "Resignation Date" },
  ],
  increment: [
    { key: "{{current_salary}}", label: "Current Salary" },
    { key: "{{new_salary}}", label: "New Salary" },
    { key: "{{increment_percentage}}", label: "Increment Percentage" },
    { key: "{{effective_date}}", label: "Effective Date" },
  ],
  dates: [
    { key: "{{current_date}}", label: "Current Date" },
    { key: "{{current_year}}", label: "Current Year" },
  ],
};

export function useLetterTemplates(type?: LetterType) {
  return useQuery({
    queryKey: ["letter-templates", type],
    queryFn: async () => {
      const url = type ? `/templates/letters?type=${type}` : "/templates/letters";
      return api.get<LetterTemplate[]>(url);
    },
  });
}

export function useLetterTemplate(id: string) {
  return useQuery({
    queryKey: ["letter-template", id],
    queryFn: async () => {
      return api.get<LetterTemplate>(`/templates/letters/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateLetterTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      type,
      content,
      placeholders = [],
      is_default = false,
    }: {
      name: string;
      type: LetterType;
      content: string;
      placeholders?: string[];
      is_default?: boolean;
    }) => {
      const data = await api.post<LetterTemplate>("/templates/letters", {
        name,
        type,
        content,
        placeholders,
        is_default,
      });

      await logAuditEvent("CREATE", "Letter Templates", `Created template: ${name}`, { template_id: data.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-templates"] });
      toast.success("Template created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useUpdateLetterTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      type,
      content,
      placeholders,
      is_default,
      is_active,
    }: {
      id: string;
      name?: string;
      type?: LetterType;
      content?: string;
      placeholders?: string[];
      is_default?: boolean;
      is_active?: boolean;
    }) => {
      const data = await api.patch<LetterTemplate>(`/templates/letters/${id}`, {
        name,
        type,
        content,
        placeholders,
        is_default,
        is_active,
      });

      await logAuditEvent("UPDATE", "Letter Templates", `Updated template: ${data.name}`, { template_id: id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-templates"] });
      queryClient.invalidateQueries({ queryKey: ["letter-template"] });
      toast.success("Template updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeleteLetterTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await api.delete(`/templates/letters/${id}`);
      await logAuditEvent("DELETE", "Letter Templates", `Deleted template: ${name}`, { template_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

// Default templates for each letter type
export const DEFAULT_TEMPLATES: Record<LetterType, string> = {
  offer: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 40px;">
    {{company_logo}}
    <h1 style="color: #1a365d; margin-bottom: 5px;">{{company_name}}</h1>
    <p style="color: #666;">{{company_address}}</p>
  </div>

  <p style="text-align: right; margin-bottom: 30px;">Date: {{current_date}}</p>

  <h2 style="text-align: center; color: #2563eb; margin-bottom: 30px;">OFFER LETTER</h2>

  <p>Dear <strong>{{employee_name}}</strong>,</p>

  <p>We are pleased to offer you the position of <strong>{{offered_designation}}</strong> at {{company_name}}.</p>

  <p><strong>Terms and Conditions:</strong></p>
  <ul>
    <li><strong>Position:</strong> {{offered_designation}}</li>
    <li><strong>Department:</strong> {{department}}</li>
    <li><strong>Start Date:</strong> {{start_date}}</li>
    <li><strong>Salary:</strong> {{offered_salary}} per annum</li>
  </ul>

  <p>Please confirm your acceptance of this offer by signing and returning a copy of this letter.</p>

  <p>We look forward to welcoming you to our team!</p>

  <div style="margin-top: 50px;">
    <p>Sincerely,</p>
    <p><strong>{{hr_name}}</strong><br/>{{hr_designation}}<br/>{{company_name}}</p>
  </div>
</div>
`,
  experience: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 40px;">
    {{company_logo}}
    <h1 style="color: #1a365d; margin-bottom: 5px;">{{company_name}}</h1>
    <p style="color: #666;">{{company_address}}</p>
  </div>

  <p style="text-align: right; margin-bottom: 30px;">Date: {{current_date}}</p>

  <h2 style="text-align: center; color: #2563eb; margin-bottom: 30px;">EXPERIENCE CERTIFICATE</h2>

  <p><strong>To Whom It May Concern,</strong></p>

  <p>This is to certify that <strong>{{employee_name}}</strong> (Employee ID: {{employee_id}}) was employed with {{company_name}} from <strong>{{date_of_joining}}</strong> to <strong>{{last_working_day}}</strong>.</p>

  <p>During this tenure of <strong>{{tenure}}</strong>, they held the position of <strong>{{designation}}</strong> in the {{department}} department.</p>

  <p>We found them to be sincere, hardworking, and a valuable member of our team. They have shown excellent professional conduct throughout their employment.</p>

  <p>We wish them all the best in their future endeavors.</p>

  <div style="margin-top: 50px;">
    <p>For {{company_name}},</p>
    <p><strong>{{hr_name}}</strong><br/>{{hr_designation}}</p>
  </div>
</div>
`,
  relieving: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 40px;">
    {{company_logo}}
    <h1 style="color: #1a365d; margin-bottom: 5px;">{{company_name}}</h1>
    <p style="color: #666;">{{company_address}}</p>
  </div>

  <p style="text-align: right; margin-bottom: 30px;">Date: {{current_date}}</p>

  <h2 style="text-align: center; color: #2563eb; margin-bottom: 30px;">RELIEVING LETTER</h2>

  <p>Dear <strong>{{employee_name}}</strong>,</p>

  <p>This is to confirm that your resignation dated <strong>{{resignation_date}}</strong> has been accepted, and you have been relieved from your duties as <strong>{{designation}}</strong> at {{company_name}} effective <strong>{{last_working_day}}</strong>.</p>

  <p>During your tenure with us from {{date_of_joining}} to {{last_working_day}}, you have made valuable contributions to the organization. We appreciate your dedication and hard work.</p>

  <p>Please ensure that all company property has been returned and all pending dues have been settled.</p>

  <p>We wish you success in your future endeavors.</p>

  <div style="margin-top: 50px;">
    <p>For {{company_name}},</p>
    <p><strong>{{hr_name}}</strong><br/>{{hr_designation}}</p>
  </div>
</div>
`,
  increment: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 40px;">
    {{company_logo}}
    <h1 style="color: #1a365d; margin-bottom: 5px;">{{company_name}}</h1>
    <p style="color: #666;">{{company_address}}</p>
  </div>

  <p style="text-align: right; margin-bottom: 30px;">Date: {{current_date}}</p>

  <h2 style="text-align: center; color: #2563eb; margin-bottom: 30px;">SALARY INCREMENT LETTER</h2>

  <p>Dear <strong>{{employee_name}}</strong>,</p>

  <p>We are pleased to inform you that based on your performance and contribution to the organization, the management has decided to revise your salary.</p>

  <p><strong>Details of the Revision:</strong></p>
  <ul>
    <li><strong>Current Salary:</strong> {{current_salary}} per annum</li>
    <li><strong>New Salary:</strong> {{new_salary}} per annum</li>
    <li><strong>Increment:</strong> {{increment_percentage}}%</li>
    <li><strong>Effective Date:</strong> {{effective_date}}</li>
  </ul>

  <p>We appreciate your hard work and dedication. We look forward to your continued contributions to the success of {{company_name}}.</p>

  <p>Congratulations!</p>

  <div style="margin-top: 50px;">
    <p>Sincerely,</p>
    <p><strong>{{hr_name}}</strong><br/>{{hr_designation}}<br/>{{company_name}}</p>
  </div>
</div>
`,
  custom: "",
};

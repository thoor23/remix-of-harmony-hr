import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";
import type { LetterType } from "./useLetterTemplates";

export interface GeneratedLetter {
  id: string;
  employee_id: string;
  template_id: string | null;
  type: string;
  content: string;
  file_url: string | null;
  status: "draft" | "generated" | "sent";
  metadata: Record<string, unknown>;
  generated_by: string | null;
  generated_at: string;
  created_at: string;
  employee?: {
    id: string;
    employee_id: string;
    profile?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

export function useGeneratedLetters(employeeId?: string) {
  return useQuery({
    queryKey: ["generated-letters", employeeId],
    queryFn: async () => {
      const url = employeeId 
        ? `/templates/generated-letters?employeeId=${employeeId}` 
        : "/templates/generated-letters";
      return api.get<GeneratedLetter[]>(url);
    },
  });
}

export function useGenerateLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employee_id,
      template_id,
      type,
      content,
      metadata = {},
    }: {
      employee_id: string;
      template_id?: string;
      type: LetterType;
      content: string;
      metadata?: Record<string, unknown>;
    }) => {
      const data = await api.post<GeneratedLetter>("/templates/generated-letters", {
        employee_id,
        template_id,
        type,
        content,
        metadata,
      });

      await logAuditEvent(
        "CREATE",
        "Generated Letters",
        `Generated ${type} letter for employee`,
        { letter_id: data.id, employee_id }
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-letters"] });
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      toast.success("Letter generated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate letter: ${error.message}`);
    },
  });
}

export function useDeleteGeneratedLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      await api.delete(`/templates/generated-letters/${id}`);
      await logAuditEvent("DELETE", "Generated Letters", `Deleted ${type} letter`, { letter_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-letters"] });
      toast.success("Letter deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete letter: ${error.message}`);
    },
  });
}

// Helper function to replace placeholders in template
export function replacePlaceholders(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value || "");
  }
  return result;
}

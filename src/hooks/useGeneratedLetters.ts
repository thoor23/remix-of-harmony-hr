import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";
import type { LetterType } from "./useLetterTemplates";
import type { Json } from "@/integrations/supabase/types";

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
      let query = supabase
        .from("generated_letters")
        .select("*")
        .order("generated_at", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as GeneratedLetter[];
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
      const { data: userData } = await supabase.auth.getUser();

      // Save the generated letter
      const { data, error } = await supabase
        .from("generated_letters")
        .insert([{
          employee_id,
          template_id,
          type,
          content,
          metadata: metadata as Json,
          generated_by: userData.user?.id,
          status: "generated",
        }])
        .select()
        .single();

      if (error) throw error;

      // Also save to documents table for the employee
      const letterTypeNames: Record<string, string> = {
        offer: "Offer Letter",
        experience: "Experience Certificate",
        relieving: "Relieving Letter",
        increment: "Increment Letter",
      };

      const { error: docError } = await supabase
        .from("documents")
        .insert([{
          name: `${letterTypeNames[type] || type} - ${new Date().toLocaleDateString()}`,
          type: "generated_letter",
          employee_id,
          document_category: "generated_letter",
          folder_path: `letters/${type}`,
          uploaded_by: userData.user?.id,
        }]);

      if (docError) console.error("Failed to save document reference:", docError);

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
      const { error } = await supabase
        .from("generated_letters")
        .delete()
        .eq("id", id);

      if (error) throw error;

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

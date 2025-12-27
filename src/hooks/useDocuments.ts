import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";

export function useMyDocuments() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ["my-documents", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!employee?.id,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          employee:employees(
            id,
            employee_id,
            user_id,
            profile:profiles!employees_user_id_fkey(first_name, last_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCompanyDocuments() {
  return useQuery({
    queryKey: ["company-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("is_company_document", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      name,
      type,
      employee_id,
      is_company_document = false,
    }: {
      file: File;
      name: string;
      type: string;
      employee_id?: string;
      is_company_document?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) throw new Error("Not authenticated");

      // Create unique file path
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert([{
          name,
          type,
          employee_id,
          file_url: filePath,
          file_size: file.size,
          uploaded_by: userId,
          is_company_document,
        }])
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent("CREATE", "Documents", `Uploaded document: ${name}`, { document_id: data.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      queryClient.invalidateQueries({ queryKey: ["company-documents"] });
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      toast.success("Document uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, file_url }: { id: string; name: string; file_url?: string }) => {
      // Delete from storage if file exists
      if (file_url) {
        await supabase.storage.from("documents").remove([file_url]);
      }

      // Delete record
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) throw error;

      await logAuditEvent("DELETE", "Documents", `Deleted document: ${name}`, { document_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      queryClient.invalidateQueries({ queryKey: ["company-documents"] });
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}

export function getDocumentDownloadUrl(filePath: string): string {
  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function downloadDocument(filePath: string, fileName: string) {
  try {
    const { data, error } = await supabase.storage.from("documents").download(filePath);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Download started");
  } catch (error) {
    toast.error("Failed to download document");
    console.error(error);
  }
}

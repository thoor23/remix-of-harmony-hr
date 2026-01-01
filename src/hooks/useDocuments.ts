import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";
import { getCompanyId } from "@/lib/supabase-helpers";

interface Document {
  id: string;
  name: string;
  type: string;
  employee_id: string | null;
  file_url: string | null;
  file_size: number | null;
  folder_path: string | null;
  document_category: string | null;
  is_company_document: boolean;
  uploaded_by: string | null;
  created_at: string;
  employee?: {
    id: string;
    employee_id: string;
    user_id: string | null;
  } | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export function useMyDocuments() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ["my-documents", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: !!employee?.id,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Document[];
    },
  });
}

export function useCompanyDocuments() {
  return useQuery({
    queryKey: ["company-documents"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_company_document', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Document[];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/${Date.now()}_${name}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          name,
          type,
          employee_id,
          file_url: filePath,
          file_size: file.size,
          is_company_document,
          uploaded_by: user.id,
          company_id: companyId,
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
      // Delete from storage if file_url exists
      if (file_url) {
        await supabase.storage.from('documents').remove([file_url]);
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

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

export function getDocumentDownloadUrl(documentId: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-documents/download/${documentId}`;
}

export async function downloadDocument(documentId: string, fileName: string) {
  try {
    // First get the document to find the file path
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (docError || !doc?.file_url) {
      throw new Error('Document not found');
    }

    // Download from storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(doc.file_url);

    if (error) throw error;

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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
      // Use query param filter instead of dedicated endpoint
      return api.get<Document[]>(`/documents?employee_id=${employee.id}`);
    },
    enabled: !!employee?.id,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      return api.get<Document[]>("/documents");
    },
  });
}

export function useCompanyDocuments() {
  return useQuery({
    queryKey: ["company-documents"],
    queryFn: async () => {
      // Use query param filter for company documents
      return api.get<Document[]>("/documents?is_company_document=true");
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("type", type);
      if (employee_id) formData.append("employee_id", employee_id);
      formData.append("is_company_document", String(is_company_document));

      const token = localStorage.getItem("access_token");
      // Backend expects POST to /documents (not /documents/upload)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/api-documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
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
    mutationFn: async ({ id, name }: { id: string; name: string; file_url?: string }) => {
      await api.delete(`/documents/${id}`);
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
  return `${SUPABASE_URL}/functions/v1/api-documents/download/${documentId}`;
}

export async function downloadDocument(documentId: string, fileName: string) {
  try {
    const token = localStorage.getItem("access_token");
    // Backend expects document ID, not file path
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-documents/download/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
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

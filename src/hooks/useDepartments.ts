import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  employee_count: number | null;
  head_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useDepartmentsData() {
  return useQuery({
    queryKey: ["departments-data"],
    queryFn: async () => {
      return api.get<Department[]>("/departments");
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      code,
      description,
    }: {
      name: string;
      code: string;
      description?: string;
    }) => {
      const data = await api.post<Department>("/departments", { name, code, description });
      await logAuditEvent("CREATE", "Departments", `Created department: ${name}`, { department_id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-data"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create department: ${error.message}`);
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      code,
      description,
    }: {
      id: string;
      name: string;
      code: string;
      description?: string;
    }) => {
      const data = await api.patch<Department>(`/departments/${id}`, { name, code, description });
      await logAuditEvent("UPDATE", "Departments", `Updated department: ${name}`, { department_id: id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-data"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update department: ${error.message}`);
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await api.delete(`/departments/${id}`);
      await logAuditEvent("DELETE", "Departments", `Deleted department: ${name}`, { department_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-data"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete department: ${error.message}`);
    },
  });
}

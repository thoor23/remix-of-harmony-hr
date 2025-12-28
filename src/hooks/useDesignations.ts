import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { logAuditEvent } from "./useAuditLogs";

interface Designation {
  id: string;
  name: string;
  code: string;
  level: number | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
  } | null;
}

export function useDesignationsData() {
  return useQuery({
    queryKey: ["designations-data"],
    queryFn: async () => {
      return api.get<Designation[]>("/designations");
    },
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      code,
      level,
      department_id,
    }: {
      name: string;
      code: string;
      level?: number;
      department_id?: string;
    }) => {
      const data = await api.post<Designation>("/designations", { name, code, level, department_id });
      await logAuditEvent("CREATE", "Designations", `Created designation: ${name}`, { designation_id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations-data"] });
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create designation: ${error.message}`);
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      code,
      level,
      department_id,
    }: {
      id: string;
      name: string;
      code: string;
      level?: number;
      department_id?: string;
    }) => {
      const data = await api.patch<Designation>(`/designations/${id}`, { name, code, level, department_id });
      await logAuditEvent("UPDATE", "Designations", `Updated designation: ${name}`, { designation_id: id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations-data"] });
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update designation: ${error.message}`);
    },
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await api.delete(`/designations/${id}`);
      await logAuditEvent("DELETE", "Designations", `Deleted designation: ${name}`, { designation_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations-data"] });
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete designation: ${error.message}`);
    },
  });
}

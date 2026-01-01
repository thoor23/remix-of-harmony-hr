import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as Department[];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('departments')
        .insert([{
          name,
          code,
          description,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;
      
      await logAuditEvent("CREATE", "Departments", `Created department: ${name}`, { department_id: data.id });
      return data as Department;
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
      const { data, error } = await supabase
        .from('departments')
        .update({ name, code, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await logAuditEvent("UPDATE", "Departments", `Updated department: ${name}`, { department_id: id });
      return data as Department;
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
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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

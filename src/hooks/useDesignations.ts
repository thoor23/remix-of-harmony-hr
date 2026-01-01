import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";
import { logAuditEvent } from "./useAuditLogs";

export interface Designation {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('designations')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as Designation[];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('designations')
        .insert([{
          name,
          code,
          level,
          department_id,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;
      
      await logAuditEvent("CREATE", "Designations", `Created designation: ${name}`, { designation_id: data.id });
      return data as Designation;
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
      const { data, error } = await supabase
        .from('designations')
        .update({ name, code, level, department_id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await logAuditEvent("UPDATE", "Designations", `Updated designation: ${name}`, { designation_id: id });
      return data as Designation;
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
      const { error } = await supabase
        .from('designations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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

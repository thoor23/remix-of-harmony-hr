import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";
import { RolePermission } from "@/types/settings";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
  is_system: boolean;
  user_count: number;
  role_type: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: RolePermission[];
  role_type?: 'admin' | 'employee';
  is_system?: boolean;
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as unknown as Role[];
    },
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["role", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Role;
    },
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('roles')
        .insert([{
          ...input,
          permissions: input.permissions as any,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Role> & { id: string }) => {
      const updateData: any = { ...data };
      if (data.permissions) {
        updateData.permissions = data.permissions as any;
      }

      const { data: result, error } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as unknown as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });
}

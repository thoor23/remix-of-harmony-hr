import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: string;
  role_id: string | null;
  created_at: string;
}

export function useUserRoleAssignment(userId: string) {
  return useQuery({
    queryKey: ["user-role-assignment", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserRoleAssignment | null;
    },
    enabled: !!userId,
  });
}

export function useUpdateUserRoleAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string | null }) => {
      // Get role name from roles table
      let roleName = 'employee';
      if (roleId) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('name')
          .eq('id', roleId)
          .single();
        
        if (roleData) {
          roleName = roleData.name.toLowerCase().includes('admin') ? 'admin' : 
                     roleData.name.toLowerCase().includes('hr') ? 'hr' : 'employee';
        }
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: roleId,
          role: roleName,
        } as any, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserRoleAssignment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-role-assignment", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("User role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });
}

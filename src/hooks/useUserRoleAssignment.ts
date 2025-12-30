import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

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
      return api.get<UserRoleAssignment>(`/settings/user-role/${userId}`);
    },
    enabled: !!userId,
  });
}

export function useUpdateUserRoleAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string | null }) => {
      return api.put<UserRoleAssignment>(`/settings/user-role/${userId}`, { role_id: roleId });
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

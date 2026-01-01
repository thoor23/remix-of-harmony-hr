import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  bank_name?: string;
  bank_account_holder_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the employee record for the current user
      const { data: employee, error: findError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (findError) throw findError;
      if (!employee) throw new Error("Employee record not found");

      // Update the employee record
      const { data: updated, error } = await supabase
        .from('employees')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-employee"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // Supabase doesn't require current password for password update when authenticated
      // But we can verify the current password by attempting a sign-in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      // Verify current password by attempting sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect");
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

export interface ProfileChangeRequest {
  id: string;
  employee_id: string;
  field_name: string;
  current_value: string | null;
  new_value: string;
  reason: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
  updated_at: string;
  employee?: any;
  reviewer?: any;
}

export function useMyProfileChangeRequests() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ["my-profile-change-requests", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const { data, error } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name, employee_id),
          reviewer:employees!profile_change_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as ProfileChangeRequest[];
    },
    enabled: !!employee?.id,
  });
}

export function useAllProfileChangeRequests() {
  return useQuery({
    queryKey: ["all-profile-change-requests"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name, employee_id, avatar_url),
          reviewer:employees!profile_change_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as ProfileChangeRequest[];
    },
  });
}

export function useCreateProfileChangeRequest() {
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();

  return useMutation({
    mutationFn: async ({
      field_name,
      current_value,
      new_value,
      reason,
    }: {
      field_name: string;
      current_value?: string;
      new_value: string;
      reason?: string;
    }) => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('profile_change_requests')
        .insert({
          employee_id: employee?.id,
          company_id: companyId,
          field_name,
          current_value,
          new_value,
          reason,
          status: 'pending',
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile-change-requests"] });
      toast.success("Profile change request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}

export function useReviewProfileChangeRequest() {
  const queryClient = useQueryClient();
  const { data: currentEmployee } = useCurrentEmployee();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      review_comments,
    }: {
      id: string;
      status: "approved" | "rejected";
      review_comments?: string;
    }) => {
      const { data, error } = await supabase
        .from('profile_change_requests')
        .update({
          status,
          review_comments,
          reviewed_by: currentEmployee?.id,
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-profile-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile-change-requests"] });
      toast.success("Request reviewed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to review request: ${error.message}`);
    },
  });
}

export function useDeleteProfileChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profile_change_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-profile-change-requests"] });
      toast.success("Change request deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete request: ${error.message}`);
    },
  });
}

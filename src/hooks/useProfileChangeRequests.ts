import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";

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
      return api.get<ProfileChangeRequest[]>(`/profile-requests/my`);
    },
    enabled: !!employee?.id,
  });
}

export function useAllProfileChangeRequests() {
  return useQuery({
    queryKey: ["all-profile-change-requests"],
    queryFn: () => api.get<ProfileChangeRequest[]>('/profile-requests'),
  });
}

export function useCreateProfileChangeRequest() {
  const queryClient = useQueryClient();

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
      return api.post('/profile-requests', {
        field_name,
        current_value,
        new_value,
        reason,
      });
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
      return api.patch(`/profile-requests/${id}`, {
        status,
        review_comments,
      });
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
      return api.delete(`/profile-requests/${id}`);
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

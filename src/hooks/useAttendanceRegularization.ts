import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface AttendanceRegularizationRequest {
  id: string;
  employee_id: string;
  attendance_id: string | null;
  request_date: string;
  request_type: string;
  original_check_in: string | null;
  original_check_out: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
  updated_at: string;
  employee?: any;
  attendance?: any;
  reviewer?: any;
}

export function useMyRegularizationRequests() {
  return useQuery({
    queryKey: ["my-regularization-requests"],
    queryFn: () => api.get<AttendanceRegularizationRequest[]>("/attendance-regularization/my"),
  });
}

export function useAllRegularizationRequests(status?: string) {
  return useQuery({
    queryKey: ["all-regularization-requests", status],
    queryFn: () => api.get<AttendanceRegularizationRequest[]>(
      `/attendance-regularization${status ? `?status=${status}` : ""}`
    ),
  });
}

export function useCreateRegularizationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      request_date: string;
      request_type?: string;
      attendance_id?: string;
      requested_check_in?: string;
      requested_check_out?: string;
      reason: string;
    }) => {
      return api.post("/attendance-regularization", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-regularization-requests"] });
      toast.success("Regularization request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}

export function useReviewRegularizationRequest() {
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
      return api.patch(`/attendance-regularization/${id}`, { status, review_comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-regularization-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-regularization-requests"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Request reviewed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to review request: ${error.message}`);
    },
  });
}

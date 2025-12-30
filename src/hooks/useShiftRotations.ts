import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export interface ShiftRotation {
  id: string;
  name: string;
  description: string | null;
  rotation_pattern: string[];
  rotation_frequency: string;
  employee_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftRotationInput {
  name: string;
  description?: string;
  rotation_pattern: string[];
  rotation_frequency: string;
  employee_ids?: string[];
  is_active?: boolean;
}

export function useShiftRotations() {
  return useQuery({
    queryKey: ["shift-rotations"],
    queryFn: async () => {
      return api.get<ShiftRotation[]>("/shifts/rotations");
    },
  });
}

export function useCreateShiftRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShiftRotationInput) => {
      return api.post<ShiftRotation>("/shifts/rotations", input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-rotations"] });
      toast.success("Shift rotation created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rotation: ${error.message}`);
    },
  });
}

export function useUpdateShiftRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ShiftRotation> & { id: string }) => {
      return api.put<ShiftRotation>(`/shifts/rotations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-rotations"] });
      toast.success("Shift rotation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update rotation: ${error.message}`);
    },
  });
}

export function useDeleteShiftRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/shifts/rotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-rotations"] });
      toast.success("Shift rotation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete rotation: ${error.message}`);
    },
  });
}

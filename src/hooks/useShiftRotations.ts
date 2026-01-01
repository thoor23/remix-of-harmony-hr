import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

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
      const companyId = await getCurrentCompanyId();
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('shift_rotations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShiftRotation[];
    },
  });
}

export function useCreateShiftRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShiftRotationInput) => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) throw new Error("Company not found");

      const { data, error } = await supabase
        .from('shift_rotations')
        .insert({
          company_id: companyId,
          name: input.name,
          description: input.description || null,
          rotation_pattern: input.rotation_pattern,
          rotation_frequency: input.rotation_frequency,
          employee_ids: input.employee_ids || [],
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShiftRotation;
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
      const { data: result, error } = await supabase
        .from('shift_rotations')
        .update({
          name: data.name,
          description: data.description,
          rotation_pattern: data.rotation_pattern,
          rotation_frequency: data.rotation_frequency,
          employee_ids: data.employee_ids,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ShiftRotation;
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
      const { error } = await supabase
        .from('shift_rotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
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

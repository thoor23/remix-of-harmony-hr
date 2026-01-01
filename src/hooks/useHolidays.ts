import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  is_optional: boolean | null;
  description: string | null;
  created_at: string;
}

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: ["holidays", year],
    queryFn: async (): Promise<Holiday[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('holidays')
        .select('*')
        .eq('company_id', companyId)
        .order('date');

      if (year) {
        query = query
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Holiday[];
    },
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holiday: {
      name: string;
      date: string;
      type?: string;
      is_optional?: boolean;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('holidays')
        .insert([{
          ...holiday,
          company_id: companyId,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add holiday: ${error.message}`);
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete holiday: ${error.message}`);
    },
  });
}

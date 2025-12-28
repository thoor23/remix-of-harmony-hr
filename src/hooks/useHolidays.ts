import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
      const params = year ? `?year=${year}` : '';
      return api.get<Holiday[]>(`/holidays${params}`);
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
      await api.post('/holidays', holiday);
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
      await api.delete(`/holidays/${id}`);
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

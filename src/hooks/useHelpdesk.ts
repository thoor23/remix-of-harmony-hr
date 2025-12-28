import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";

export function useMyTickets() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ["my-tickets", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      return api.get<any[]>(`/helpdesk/employee/${employee.id}`);
    },
    enabled: !!employee?.id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();

  return useMutation({
    mutationFn: async ({
      subject,
      description,
      category,
      priority,
    }: {
      subject: string;
      description?: string;
      category: string;
      priority: string;
    }) => {
      if (!employee?.id) throw new Error("Employee not found");

      await api.post('/helpdesk', {
        employee_id: employee.id,
        subject,
        description,
        category,
        priority,
      });
      
      return { subject, category, priority };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast.success("Ticket created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create ticket: ${error.message}`);
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      await api.patch(`/helpdesk/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast.success("Ticket updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update ticket: ${error.message}`);
    },
  });
}

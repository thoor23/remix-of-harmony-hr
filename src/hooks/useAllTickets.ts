import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface TicketWithEmployee {
  id: string;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  employee_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    employee_id: string;
  };
  assignee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export function useAllTickets() {
  return useQuery({
    queryKey: ["all-tickets"],
    queryFn: async () => {
      return api.get<TicketWithEmployee[]>('/helpdesk');
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      assignedTo,
    }: {
      ticketId: string;
      assignedTo: string | null;
    }) => {
      await api.patch(`/helpdesk/${ticketId}`, { assigned_to: assignedTo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
      toast.success("Ticket assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign ticket: ${error.message}`);
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: string;
    }) => {
      await api.patch(`/helpdesk/${ticketId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
      toast.success("Ticket status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update ticket: ${error.message}`);
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      await api.delete(`/helpdesk/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
      toast.success("Ticket deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete ticket: ${error.message}`);
    },
  });
}

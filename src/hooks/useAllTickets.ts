import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

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
      const companyId = await getCurrentCompanyId();
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select(`
          *,
          employee:employees!helpdesk_tickets_employee_id_fkey(id, first_name, last_name, email, employee_id),
          assignee:employees!helpdesk_tickets_assigned_to_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as TicketWithEmployee[];
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
      const { error } = await supabase
        .from('helpdesk_tickets')
        .update({ assigned_to: assignedTo })
        .eq('id', ticketId);
      
      if (error) throw error;
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
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('helpdesk_tickets')
        .update(updateData)
        .eq('id', ticketId);
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('helpdesk_tickets')
        .delete()
        .eq('id', ticketId);
      
      if (error) throw error;
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

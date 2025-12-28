import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  sender?: {
    id: string;
    employee_id: string;
    profile?: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: () => api.get<TicketMessage[]>(`/helpdesk/${ticketId}/messages`),
    enabled: !!ticketId,
    refetchInterval: 10000, // Poll every 10 seconds for new messages
  });
}

export function useSendTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticket_id,
      message,
      is_internal = false,
    }: {
      ticket_id: string;
      message: string;
      is_internal?: boolean;
    }) => {
      return api.post(`/helpdesk/${ticket_id}/messages`, {
        message,
        is_internal,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", variables.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

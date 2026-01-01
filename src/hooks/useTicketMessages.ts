import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";
import { useCurrentEmployee } from "./useCurrentEmployee";

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
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:employees(id, employee_id, first_name, last_name, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as TicketMessage[];
    },
    enabled: !!ticketId,
    refetchInterval: 10000,
  });
}

export function useSendTicketMessage() {
  const queryClient = useQueryClient();
  const { data: currentEmployee } = useCurrentEmployee();

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
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id,
          sender_id: currentEmployee?.id,
          company_id: companyId,
          message,
          is_internal,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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

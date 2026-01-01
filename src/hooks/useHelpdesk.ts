import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export function useMyTickets() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ["my-tickets", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];

      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('helpdesk_tickets')
        .insert([{
          employee_id: employee.id,
          subject,
          description,
          category,
          priority,
          company_id: companyId,
          status: 'open',
        }]);
      
      if (error) throw error;
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
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('helpdesk_tickets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
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

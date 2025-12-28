import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "./useCurrentEmployee";
import { toast } from "sonner";
import { notifyAdmins } from "@/lib/notificationHelper";

export function useMyTickets() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ["my-tickets", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];

      const { data, error } = await supabase
        .from("helpdesk_tickets")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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

      const { error } = await supabase.from("helpdesk_tickets").insert({
        employee_id: employee.id,
        subject,
        description,
        category,
        priority,
      });

      if (error) throw error;
      
      return { subject, category, priority };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast.success("Ticket created successfully");
      
      // Notify admins about new ticket
      await notifyAdmins(
        "New Helpdesk Ticket",
        `A new ${data.priority} priority ticket has been submitted: "${data.subject}"`,
        data.priority === "high" || data.priority === "urgent" ? "warning" : "info",
        "/admin/helpdesk"
      );
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
      const { error } = await supabase
        .from("helpdesk_tickets")
        .update({
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreateEmployeeAccountData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  employee_data: {
    employee_id: string;
    date_of_birth?: string;
    date_of_joining: string;
    department_id?: string;
    designation_id?: string;
    employment_type: string;
    status?: string;
    reporting_to?: string;
    primary_store_id?: string;
    address_street?: string;
    address_city?: string;
    address_state?: string;
    address_zip_code?: string;
    address_country?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    bank_name?: string;
    bank_account_holder_name?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
  };
}

export function useCreateEmployeeAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeAccountData) => {
      // Call the edge function for creating employee accounts
      const { data: result, error } = await supabase.functions.invoke('create-employee-account', {
        body: data,
      });

      if (error) throw error;
      return result as { userId: string; employeeId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee account created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create employee account: ${error.message}`);
    },
  });
}

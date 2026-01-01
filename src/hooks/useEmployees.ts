import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";
import { logAuditEvent } from "./useAuditLogs";

export interface EmployeeWithDetails {
  id: string;
  employee_id: string;
  user_id: string | null;
  status: string;
  employment_type: string;
  date_of_joining: string;
  date_of_birth: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  reporting_to: string | null;
  primary_store_id: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  address_country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  bank_name: string | null;
  bank_account_holder_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  designation: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// For admin/HR - full employee details
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          designation:designations(*)
        `)
        .eq('company_id', companyId)
        .order('first_name');

      if (error) throw error;
      return (data || []) as EmployeeWithDetails[];
    },
  });
}

// For all authenticated users - basic employee info (for shift exchange, etc.)
export interface BasicEmployee {
  id: string;
  employee_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  status: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export function useEmployeeList() {
  return useQuery({
    queryKey: ["employee-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          avatar_url,
          status,
          department:departments(id, name, code)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return (data || []) as BasicEmployee[];
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          designation:designations(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as EmployeeWithDetails | null;
    },
    enabled: !!id,
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await logAuditEvent('DELETE', 'Employees', `Deleted employee: ${id}`, { employee_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete employee: ${error.message}`);
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: ["designations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('designations')
        .select(`
          *,
          department:departments(id, name, code)
        `)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export interface CreateEmployeeData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  date_of_joining: string;
  department_id: string | null;
  designation_id: string | null;
  employment_type: string;
  reporting_to: string | null;
  primary_store_id?: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  address_country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  bank_name: string | null;
  bank_account_holder_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeData: CreateEmployeeData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          company_id: companyId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      
      await logAuditEvent('CREATE', 'Employees', `Created employee: ${employeeData.first_name} ${employeeData.last_name}`, { employee_id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create employee: ${error.message}`);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<CreateEmployeeData> }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await logAuditEvent('UPDATE', 'Employees', `Updated employee: ${id}`, { employee_id: id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      toast.success("Employee updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });
}

export function useEmployeeAttendance(employeeId: string) {
  return useQuery({
    queryKey: ["employee-attendance", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });
}

export function useEmployeeLeaves(employeeId: string) {
  return useQuery({
    queryKey: ["employee-leaves", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(*)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });
}

export interface UpdateEmployeeAccountData {
  employee_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role?: string;
  role_id?: string;
  status?: "active" | "inactive";
  password?: string;
}

// This still uses edge function because it needs to update auth.users
export function useUpdateEmployeeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateEmployeeAccountData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-employee-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update employee account');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      toast.success("Employee account updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update employee account: ${error.message}`);
    },
  });
}

export function useEmployeeRole(userId: string | null) {
  return useQuery({
    queryKey: ["employee-role", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, role_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return data ? { role: data.role, role_id: data.role_id } : null;
    },
    enabled: !!userId,
  });
}

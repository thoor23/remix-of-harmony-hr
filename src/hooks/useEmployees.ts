import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeWithDetails {
  id: string;
  employee_id: string;
  user_id: string | null;
  status: string;
  employment_type: string;
  date_of_joining: string;
  date_of_birth: string | null;
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
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          employee_id,
          user_id,
          status,
          employment_type,
          date_of_joining,
          date_of_birth,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for employees with user_id
      const userIds = data?.filter(e => e.user_id).map(e => e.user_id) || [];
      
      let profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, email, phone, avatar_url")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(emp => ({
        ...emp,
        profile: emp.user_id ? profiles[emp.user_id] || null : null,
      })) as EmployeeWithDetails[];
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch profile if user_id exists
      let profile = null;
      if (data.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user_id)
          .maybeSingle();
        profile = profileData;
      }

      return { ...data, profile };
    },
    enabled: !!id,
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: ["designations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designations")
        .select("*, department:departments(id, name)")
        .order("name");

      if (error) throw error;
      return data;
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
    mutationFn: async (data: CreateEmployeeData) => {
      // Insert employee record (without creating auth user for now)
      const { error } = await supabase
        .from("employees")
        .insert({
          employee_id: data.employee_id,
          date_of_birth: data.date_of_birth || null,
          date_of_joining: data.date_of_joining,
          department_id: data.department_id || null,
          designation_id: data.designation_id || null,
          employment_type: data.employment_type,
          reporting_to: data.reporting_to || null,
          address_street: data.address_street || null,
          address_city: data.address_city || null,
          address_state: data.address_state || null,
          address_zip_code: data.address_zip_code || null,
          address_country: data.address_country || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_relationship: data.emergency_contact_relationship || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          bank_name: data.bank_name || null,
          bank_account_holder_name: data.bank_account_holder_name || null,
          bank_account_number: data.bank_account_number || null,
          bank_ifsc_code: data.bank_ifsc_code || null,
        });

      if (error) throw error;
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateEmployeeData> }) => {
      const { error } = await supabase
        .from("employees")
        .update({
          employee_id: data.employee_id,
          date_of_birth: data.date_of_birth || null,
          date_of_joining: data.date_of_joining,
          department_id: data.department_id || null,
          designation_id: data.designation_id || null,
          employment_type: data.employment_type,
          reporting_to: data.reporting_to || null,
          address_street: data.address_street || null,
          address_city: data.address_city || null,
          address_state: data.address_state || null,
          address_zip_code: data.address_zip_code || null,
          address_country: data.address_country || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_relationship: data.emergency_contact_relationship || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          bank_name: data.bank_name || null,
          bank_account_holder_name: data.bank_account_holder_name || null,
          bank_account_number: data.bank_account_number || null,
          bank_ifsc_code: data.bank_ifsc_code || null,
        })
        .eq("id", id);

      if (error) throw error;
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
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useEmployeeLeaves(employeeId: string) {
  return useQuery({
    queryKey: ["employee-leaves", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, leave_type:leave_types(id, name, code)")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

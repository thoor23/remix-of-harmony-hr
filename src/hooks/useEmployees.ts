import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  // Flattened fields from backend
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  department_name?: string | null;
  designation_name?: string | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const data = await api.get<any[]>('/employees');
      // Transform backend response to match expected format
      return data.map(emp => ({
        ...emp,
        department: emp.department_name ? { id: emp.department_id, name: emp.department_name, code: '' } : null,
        designation: emp.designation_name ? { id: emp.designation_id, name: emp.designation_name, code: '' } : null,
        profile: emp.profile ? {
          first_name: emp.profile.first_name,
          last_name: emp.profile.last_name,
          email: emp.profile.email,
          phone: emp.profile.phone,
          avatar_url: emp.profile.avatar_url,
        } : null
      })) as EmployeeWithDetails[];
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const emp = await api.get<any>(`/employees/${id}`);
      if (!emp) return null;
      return {
        ...emp,
        department: emp.department_name ? { id: emp.department_id, name: emp.department_name, code: '' } : null,
        designation: emp.designation_name ? { id: emp.designation_id, name: emp.designation_name, code: '' } : null,
        profile: emp.profile ? {
          first_name: emp.profile.first_name,
          last_name: emp.profile.last_name,
          email: emp.profile.email,
          phone: emp.profile.phone,
          avatar_url: emp.profile.avatar_url,
        } : null
      };
    },
    enabled: !!id,
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
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
    queryFn: () => api.get<any[]>('/departments'),
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: ["designations"],
    queryFn: () => api.get<any[]>('/designations'),
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
      await api.post('/employees', data);
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
      await api.put(`/employees/${id}`, data);
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
    queryFn: () => api.get<any[]>(`/attendance/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export function useEmployeeLeaves(employeeId: string) {
  return useQuery({
    queryKey: ["employee-leaves", employeeId],
    queryFn: () => api.get<any[]>(`/leaves/requests/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export interface UpdateEmployeeAccountData {
  employee_id: string;
  user_id: string;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  role?: "admin" | "hr" | "manager" | "employee";
  status?: "active" | "inactive";
  password?: string;
}

export function useUpdateEmployeeAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeAccountData) => {
      return await api.put(`/employees/${data.employee_id}/account`, data);
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
      const data = await api.get<{ role: string }>(`/employees/role/${userId}`);
      return data?.role || null;
    },
    enabled: !!userId,
  });
}

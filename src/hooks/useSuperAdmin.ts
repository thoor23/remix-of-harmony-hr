import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  website: string | null;
  domain: string | null;
  is_active: boolean;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  max_employees: number | null;
  created_at: string;
  updated_at: string;
  employee_count?: number;
}

interface SuperAdmin {
  id: string;
  user_id: string;
  created_at: string;
  user?: {
    email: string;
  };
}

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalEmployees: number;
  totalUsers: number;
  companiesByPlan: { plan: string; count: number }[];
  recentCompanies: Company[];
}

export function useSuperAdmin() {
  const queryClient = useQueryClient();

  // Fetch all companies
  const companiesQuery = useQuery({
    queryKey: ["super-admin", "companies"],
    queryFn: async () => {
      const response = await api.get<{ data: Company[] }>("/api-super-admin/companies");
      return response.data;
    },
  });

  // Fetch platform stats
  const statsQuery = useQuery({
    queryKey: ["super-admin", "stats"],
    queryFn: async () => {
      const response = await api.get<PlatformStats>("/api-super-admin/stats");
      return response;
    },
  });

  // Fetch super admin users
  const superAdminsQuery = useQuery({
    queryKey: ["super-admin", "users"],
    queryFn: async () => {
      const response = await api.get<{ data: SuperAdmin[] }>("/api-super-admin/super-admins");
      return response.data;
    },
  });

  // Create company
  const createCompanyMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      return api.post<Company>("/api-super-admin/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "stats"] });
      toast.success("Company created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create company");
    },
  });

  // Update company
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      return api.put<Company>(`/api-super-admin/companies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "companies"] });
      toast.success("Company updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company");
    },
  });

  // Toggle company status
  const toggleCompanyStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/api-super-admin/companies/${id}/status`, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "companies"] });
      toast.success("Company status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company status");
    },
  });

  // Add super admin
  const addSuperAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post("/api-super-admin/super-admins", { user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      toast.success("Super admin added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add super admin");
    },
  });

  // Remove super admin
  const removeSuperAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api-super-admin/super-admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      toast.success("Super admin removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove super admin");
    },
  });

  return {
    // Queries
    companies: companiesQuery.data || [],
    companiesLoading: companiesQuery.isLoading,
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    superAdmins: superAdminsQuery.data || [],
    superAdminsLoading: superAdminsQuery.isLoading,
    
    // Mutations
    createCompany: createCompanyMutation.mutate,
    updateCompany: updateCompanyMutation.mutate,
    toggleCompanyStatus: toggleCompanyStatusMutation.mutate,
    addSuperAdmin: addSuperAdminMutation.mutate,
    removeSuperAdmin: removeSuperAdminMutation.mutate,
    
    // Loading states
    isCreating: createCompanyMutation.isPending,
    isUpdating: updateCompanyMutation.isPending,
  };
}

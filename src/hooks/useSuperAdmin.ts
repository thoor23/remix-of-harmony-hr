import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get employee counts for each company
      const companiesWithCounts = await Promise.all(
        (data || []).map(async (company) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          
          return { ...company, employee_count: count || 0 };
        })
      );
      
      return companiesWithCounts as Company[];
    },
  });

  // Fetch platform stats
  const statsQuery = useQuery({
    queryKey: ["super-admin", "stats"],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const allCompanies = companies || [];
      const activeCompanies = allCompanies.filter(c => c.is_active).length;
      
      // Group by plan
      const planCounts: Record<string, number> = {};
      allCompanies.forEach(c => {
        const plan = c.subscription_plan || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });
      
      return {
        totalCompanies: allCompanies.length,
        activeCompanies,
        totalEmployees: totalEmployees || 0,
        totalUsers: totalUsers || 0,
        companiesByPlan: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
        recentCompanies: allCompanies.slice(0, 5),
      } as PlatformStats;
    },
  });

  // Fetch super admin users
  const superAdminsQuery = useQuery({
    queryKey: ["super-admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admins')
        .select(`
          id,
          user_id,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user emails from profiles
      const adminsWithEmails = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', admin.user_id)
            .maybeSingle();
          
          return {
            ...admin,
            user: { email: profile?.email || 'Unknown' },
          };
        })
      );
      
      return adminsWithEmails as SuperAdmin[];
    },
  });

  // Create company
  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: Partial<Company>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(companyData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as Company;
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
      const { data: updated, error } = await supabase
        .from('companies')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated as Company;
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
      const { error } = await supabase
        .from('companies')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('super_admins')
        .insert({ user_id: userId } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('super_admins')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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

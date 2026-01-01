import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CompanyBranding {
  companyName: string;
  companyLogo: string | null;
  companyFavicon: string | null;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  logoSize: number;
  nameSize: number;
  nameFontWeight: "normal" | "medium" | "semibold" | "bold";
  nameItalic: boolean;
}

const defaultBranding: CompanyBranding = {
  companyName: "HRMS Portal",
  companyLogo: null,
  companyFavicon: null,
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  companyWebsite: "",
  logoSize: 32,
  nameSize: 18,
  nameFontWeight: "semibold",
  nameItalic: false,
};

export function useCompanyBranding() {
  return useQuery({
    queryKey: ["company-branding"],
    queryFn: async () => {
      try {
        // Use public endpoint that doesn't require authentication
        const response = await fetch(`${SUPABASE_URL}/functions/v1/api-settings/public/branding`);
        if (!response.ok) {
          // Fallback to direct query
          const companyId = await getCompanyId();
          const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('company_id', companyId)
            .eq('key', 'company_branding')
            .maybeSingle();
          
          if (data?.value) {
            return { ...defaultBranding, ...(data.value as any) };
          }
          return defaultBranding;
        }
        const data = await response.json();
        return {
          ...defaultBranding,
          ...data.value,
        };
      } catch {
        return defaultBranding;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useUpdateCompanyBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: Partial<CompanyBranding>) => {
      const companyId = await getCompanyId();
      
      // First get the current branding
      const { data: existing } = await supabase
        .from('system_settings')
        .select('value')
        .eq('company_id', companyId)
        .eq('key', 'company_branding')
        .maybeSingle();
      
      const currentBranding = existing?.value ? { ...defaultBranding, ...(existing.value as any) } : defaultBranding;
      const updatedBranding = { ...currentBranding, ...branding };
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          company_id: companyId,
          key: 'company_branding',
          value: updatedBranding,
        } as any, { onConflict: 'company_id,key' });
      
      if (error) throw error;
      return updatedBranding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
      toast.success("Company branding updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update branding: ${error.message}`);
    },
  });
}

export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/api-settings/branding/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload logo");
      }

      const result = await response.json();
      return result.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
      toast.success("Logo uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload logo: ${error.message}`);
    },
  });
}

export function useDeleteCompanyLogo() {
  const queryClient = useQueryClient();
  const updateBranding = useUpdateCompanyBranding();

  return useMutation({
    mutationFn: async () => {
      await updateBranding.mutateAsync({ companyLogo: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
      toast.success("Logo deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete logo: ${error.message}`);
    },
  });
}

export function useUploadFavicon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "favicon");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/api-settings/branding/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload favicon");
      }

      const result = await response.json();
      return result.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
      toast.success("Favicon uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload favicon: ${error.message}`);
    },
  });
}

export function useDeleteFavicon() {
  const queryClient = useQueryClient();
  const updateBranding = useUpdateCompanyBranding();

  return useMutation({
    mutationFn: async () => {
      await updateBranding.mutateAsync({ companyFavicon: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
      toast.success("Favicon deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete favicon: ${error.message}`);
    },
  });
}

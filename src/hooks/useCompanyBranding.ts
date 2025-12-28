import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { getAccessToken } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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
        const response = await fetch(`${API_URL}/settings/public/branding`);
        if (!response.ok) {
          throw new Error("Failed to fetch branding");
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
      // First get the current branding
      let currentBranding: CompanyBranding = defaultBranding;
      try {
        const current = await api.get<{ value: Partial<CompanyBranding> }>("/settings/company_branding");
        currentBranding = { ...defaultBranding, ...current.value };
      } catch {
        // Use default if not found
      }

      const updatedBranding = { ...currentBranding, ...branding };
      await api.put("/settings/company_branding", { value: updatedBranding });
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

      const response = await fetch(`${API_URL}/settings/branding/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
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

  return useMutation({
    mutationFn: async () => {
      await api.delete("/settings/branding/logo");
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

      const response = await fetch(`${API_URL}/settings/branding/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
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

  return useMutation({
    mutationFn: async () => {
      await api.delete("/settings/branding/favicon");
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

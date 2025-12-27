import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "company_branding")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return defaultBranding;
      
      return {
        ...defaultBranding,
        ...(data.value as unknown as Partial<CompanyBranding>),
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useUpdateCompanyBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: Partial<CompanyBranding>) => {
      // First get the current branding
      const { data: current } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "company_branding")
        .maybeSingle();

      const currentBranding = current?.value as unknown as CompanyBranding || defaultBranding;
      const updatedBranding = { ...currentBranding, ...branding };

      const { error } = await supabase
        .from("system_settings")
        .update({ value: updatedBranding as unknown as Json })
        .eq("key", "company_branding");

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
      const fileExt = file.name.split(".").pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `branding/${fileName}`;

      // Delete existing logo if any
      await supabase.storage.from("company-assets").remove([filePath]);

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-assets")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
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
      // Try to delete common logo file extensions
      const extensions = ["png", "jpg", "jpeg", "svg", "webp"];
      const filesToDelete = extensions.map((ext) => `branding/logo.${ext}`);
      
      await supabase.storage.from("company-assets").remove(filesToDelete);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
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
      const fileExt = file.name.split(".").pop();
      const fileName = `favicon.${fileExt}`;
      const filePath = `branding/${fileName}`;

      // Delete existing favicon if any
      const extensions = ["png", "ico", "svg"];
      const filesToDelete = extensions.map((ext) => `branding/favicon.${ext}`);
      await supabase.storage.from("company-assets").remove(filesToDelete);

      // Upload new favicon
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-assets")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
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
      const extensions = ["png", "ico", "svg"];
      const filesToDelete = extensions.map((ext) => `branding/favicon.${ext}`);
      await supabase.storage.from("company-assets").remove(filesToDelete);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete favicon: ${error.message}`);
    },
  });
}

import { useEffect } from "react";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";

export function DynamicFavicon() {
  const { data: branding } = useCompanyBranding();

  useEffect(() => {
    if (!branding?.companyFavicon) return;

    // Find existing favicon link or create one
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    
    link.href = branding.companyFavicon;
  }, [branding?.companyFavicon]);

  return null;
}

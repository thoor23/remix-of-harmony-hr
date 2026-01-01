import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface EmailConfig {
  enabled: boolean;
  provider: "resend" | "smtp";
  
  // Resend Configuration
  resendApiKey: string;
  resendFromEmail: string;
  resendFromName: string;
  
  // SMTP Configuration
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpSecure: boolean;
  
  // Test status
  lastTestedAt: string | null;
  lastTestStatus: "success" | "error" | null;
  lastTestMessage: string | null;
}

const defaultEmailConfig: EmailConfig = {
  enabled: false,
  provider: "resend",
  resendApiKey: "",
  resendFromEmail: "",
  resendFromName: "",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpFromEmail: "",
  smtpFromName: "",
  smtpSecure: true,
  lastTestedAt: null,
  lastTestStatus: null,
  lastTestMessage: null,
};

export function useEmailConfig() {
  return useQuery({
    queryKey: ["email-config"],
    queryFn: async () => {
      try {
        const data = await api.get<{ value: Partial<EmailConfig> }>("/settings/email_config");
        return { ...defaultEmailConfig, ...data.value };
      } catch {
        return defaultEmailConfig;
      }
    },
  });
}

export function useUpdateEmailConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<EmailConfig>) => {
      // Get current config first
      let currentConfig: Partial<EmailConfig> = {};
      try {
        const existing = await api.get<{ value: Partial<EmailConfig> }>("/settings/email_config");
        currentConfig = existing.value || {};
      } catch {
        // No existing config
      }

      const updatedConfig = { ...currentConfig, ...config };
      await api.put("/settings/email_config", { value: updatedConfig });
      return updatedConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-config"] });
      toast.success("Email configuration saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save email configuration: ${error.message}`);
    },
  });
}

export function useSendTestEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientEmail, config }: { recipientEmail: string; config: EmailConfig }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipientEmail, config }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send test email");
      }
      
      return result;
    },
    onSuccess: async () => {
      // Update the test status in the config
      const now = new Date().toISOString();
      try {
        const existing = await api.get<{ value: Partial<EmailConfig> }>("/settings/email_config");
        const currentConfig = existing.value || {};
        await api.put("/settings/email_config", {
          value: {
            ...currentConfig,
            lastTestedAt: now,
            lastTestStatus: "success",
            lastTestMessage: "Test email sent successfully",
          },
        });
      } catch {
        // Ignore error updating test status
      }
        
      queryClient.invalidateQueries({ queryKey: ["email-config"] });
      toast.success("Test email sent successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });
}

// SMTP Provider presets
export const smtpPresets = {
  gmail: {
    name: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    helpUrl: "https://support.google.com/accounts/answer/185833",
  },
  outlook: {
    name: "Outlook / Hotmail",
    host: "smtp.office365.com",
    port: 587,
    secure: true,
    helpUrl: "https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944",
  },
  yahoo: {
    name: "Yahoo Mail",
    host: "smtp.mail.yahoo.com",
    port: 587,
    secure: true,
    helpUrl: "https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html",
  },
  custom: {
    name: "Custom SMTP",
    host: "",
    port: 587,
    secure: true,
    helpUrl: "",
  },
} as const;

export type SmtpPresetKey = keyof typeof smtpPresets;

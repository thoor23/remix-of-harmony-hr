import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "email_config")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return defaultEmailConfig;
      }
      
      return { ...defaultEmailConfig, ...(data.value as unknown as Partial<EmailConfig>) };
    },
  });
}

export function useUpdateEmailConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<EmailConfig>) => {
      // First get the current config
      const { data: existing } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "email_config")
        .maybeSingle();

      const currentConfig = existing?.value as unknown as Partial<EmailConfig> || {};
      const updatedConfig = { ...currentConfig, ...config };

      const { error } = await supabase
        .from("system_settings")
        .update({ value: updatedConfig as unknown as Json })
        .eq("key", "email_config");

      if (error) throw error;
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
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: { recipientEmail, config },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: async () => {
      // Update the test status in the config
      const now = new Date().toISOString();
      await supabase
        .from("system_settings")
        .update({ 
          value: supabase.rpc ? undefined : {
            lastTestedAt: now,
            lastTestStatus: "success",
            lastTestMessage: "Test email sent successfully"
          } as unknown as Json
        })
        .eq("key", "email_config");
        
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

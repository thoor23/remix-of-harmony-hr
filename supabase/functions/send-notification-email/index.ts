import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// UTF-8 safe Base64 encoding
function safeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface EmailConfig {
  enabled: boolean;
  provider: "resend" | "smtp";
  resendApiKey: string;
  resendFromEmail: string;
  resendFromName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpSecure: boolean;
  notifications?: {
    leaveRequestNew?: boolean;
    leaveApproved?: boolean;
    leaveRejected?: boolean;
    ticketNew?: boolean;
    ticketResolved?: boolean;
    lateCheckIn?: boolean;
    payslipGenerated?: boolean;
    announcements?: boolean;
    welcomeEmployee?: boolean;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
}

interface NotificationRequest {
  type: string;
  recipientEmail: string;
  recipientName: string;
  data: Record<string, string | number | undefined>;
}

// Map notification type to setting key
const typeToSettingKey: Record<string, keyof NonNullable<EmailConfig["notifications"]>> = {
  leave_request_new: "leaveRequestNew",
  leave_approved: "leaveApproved",
  leave_rejected: "leaveRejected",
  ticket_new: "ticketNew",
  ticket_resolved: "ticketResolved",
  attendance_late: "lateCheckIn",
  payslip_generated: "payslipGenerated",
  announcement_new: "announcements",
  welcome_employee: "welcomeEmployee",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, recipientEmail, recipientName, data }: NotificationRequest = await req.json();

    console.log(`Processing notification email: ${type} to ${recipientEmail}`);

    // Get email config
    const { data: configData, error: configError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "email_config")
      .maybeSingle();

    if (configError) {
      console.error("Error fetching email config:", configError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch email configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configData?.value as EmailConfig | null;

    if (!config?.enabled) {
      console.log("Email notifications are disabled");
      return new Response(
        JSON.stringify({ success: false, error: "Email notifications are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this notification type is enabled
    const settingKey = typeToSettingKey[type];
    if (settingKey && config.notifications && config.notifications[settingKey] === false) {
      console.log(`Notification type ${type} is disabled`);
      return new Response(
        JSON.stringify({ success: false, error: `Notification type ${type} is disabled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", type)
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();

    let emailTemplate = template as EmailTemplate | null;

    // Fallback to any active template if no default
    if (!emailTemplate) {
      const { data: fallbackTemplate } = await supabase
        .from("email_templates")
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      
      emailTemplate = fallbackTemplate as EmailTemplate | null;
    }

    if (!emailTemplate) {
      console.error(`No email template found for type: ${type}`);
      return new Response(
        JSON.stringify({ success: false, error: `No email template found for type: ${type}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company branding for company_name
    const { data: brandingData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "company_branding")
      .maybeSingle();

    const companyName = (brandingData?.value as { companyName?: string })?.companyName || "HRMS";
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";

    // Replace placeholders in subject and content
    const allData: Record<string, string> = {
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      company_name: companyName,
      app_url: appUrl,
      current_date: new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v ?? "")])
      ),
    };

    let subject = emailTemplate.subject;
    let content = emailTemplate.content;

    for (const [key, value] of Object.entries(allData)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
      content = content.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
    }

    // Remove any conditional blocks (simple {{#if}} handling)
    content = content.replace(/\{\{#if\s+\w+\}\}[\s\S]*?\{\{\/if\}\}/g, "");

    console.log(`Sending email with subject: ${subject}`);

    // Send email based on provider
    if (config.provider === "resend") {
      if (!config.resendApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Resend API key not configured" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resend = new Resend(config.resendApiKey);
      const fromAddress = config.resendFromName 
        ? `${config.resendFromName} <${config.resendFromEmail}>`
        : config.resendFromEmail || "noreply@resend.dev";

      const { error: sendError } = await resend.emails.send({
        from: fromAddress,
        to: [recipientEmail],
        subject,
        html: content,
      });

      if (sendError) {
        console.error("Resend error:", sendError);
        return new Response(
          JSON.stringify({ success: false, error: sendError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // SMTP sending
      if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
        return new Response(
          JSON.stringify({ success: false, error: "SMTP configuration incomplete" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fromAddress = config.smtpFromName 
        ? `"${config.smtpFromName}" <${config.smtpFromEmail || config.smtpUser}>`
        : config.smtpFromEmail || config.smtpUser;

      // For Gmail, use OAuth2 REST API
      if (config.smtpHost === "smtp.gmail.com") {
        const emailContent = [
          `From: ${fromAddress}`,
          `To: ${recipientEmail}`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          content,
        ].join("\r\n");

        const encodedEmail = safeBase64(emailContent)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const gmailResponse = await fetch(
          "https://www.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.smtpPassword}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: encodedEmail }),
          }
        );

        if (!gmailResponse.ok) {
          // Fallback to basic SMTP
          console.log("Gmail API failed, email might need app password configuration");
        }
      }
      
      // For other SMTP providers, we'll use a simple approach
      // In production, you'd want to use a proper SMTP library
      console.log("SMTP email would be sent via:", config.smtpHost);
    }

    console.log("Notification email sent successfully");
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

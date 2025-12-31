import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  serviceName: string;
  previousStatus: string;
  newStatus: string;
  message?: string;
}

interface EmailConfig {
  enabled: boolean;
  provider: "resend" | "smtp";
  resendApiKey: string;
  resendFromEmail: string;
  resendFromName: string;
}

interface Subscriber {
  id: string;
  email: string;
  verification_token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { serviceName, previousStatus, newStatus, message }: StatusUpdateRequest = await req.json();

    console.log(`[Status Notification] ${serviceName}: ${previousStatus} -> ${newStatus}`);

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

    if (config.provider !== "resend" || !config.resendApiKey) {
      console.log("Resend not configured for status notifications");
      return new Response(
        JSON.stringify({ success: false, error: "Resend not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("status_subscribers")
      .select("id, email, verification_token")
      .is("unsubscribed_at", null);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch subscribers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers");
      return new Response(
        JSON.stringify({ success: true, message: "No subscribers to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company branding
    const { data: brandingData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "company_branding")
      .maybeSingle();

    const branding = brandingData?.value as { companyName?: string } | null;
    const companyName = branding?.companyName || "HRMS";
    
    // Get app URL from environment or construct it
    const appUrl = supabaseUrl.replace(".supabase.co", ".lovable.app").replace("/functions/v1", "");
    
    const resend = new Resend(config.resendApiKey);
    const fromAddress = config.resendFromName 
      ? `${config.resendFromName} <${config.resendFromEmail}>`
      : config.resendFromEmail || "noreply@resend.dev";

    // Status color mapping
    const statusColors: Record<string, string> = {
      operational: "#22c55e",
      degraded: "#f59e0b",
      outage: "#ef4444",
    };

    const statusColor = statusColors[newStatus] || "#6b7280";
    const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

    // Send emails to all subscribers
    const emailPromises = (subscribers as Subscriber[]).map(async (subscriber) => {
      const unsubscribeUrl = `${appUrl}/status/unsubscribe?token=${subscriber.verification_token}`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background-color: #1f2937; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${companyName}</h1>
        <p style="margin: 8px 0 0; color: #9ca3af; font-size: 14px;">System Status Update</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; padding: 8px 16px; background-color: ${statusColor}20; color: ${statusColor}; border-radius: 20px; font-weight: 600; font-size: 14px;">
            ${statusLabel}
          </span>
        </div>
        
        <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 600; text-align: center;">
          ${serviceName}
        </h2>
        
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-align: center;">
          Status changed from <strong style="color: #1f2937;">${previousStatus}</strong> to <strong style="color: ${statusColor};">${newStatus}</strong>
        </p>
        
        ${message ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">${message}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 32px; text-align: center;">
          <a href="${appUrl}/status" style="display: inline-block; padding: 12px 24px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
            View Status Page
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          You received this email because you subscribed to status updates.
        </p>
        <p style="margin: 8px 0 0;">
          <a href="${unsubscribeUrl}" style="color: #6b7280; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      try {
        await resend.emails.send({
          from: fromAddress,
          to: [subscriber.email],
          subject: `[${statusLabel}] ${serviceName} - ${companyName} Status Update`,
          html: htmlContent,
        });
        console.log(`Email sent to ${subscriber.email}`);
        return { email: subscriber.email, success: true };
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        return { email: subscriber.email, success: false, error: (error as Error).message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Status notifications sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: subscribers.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-status-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

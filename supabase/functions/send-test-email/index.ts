import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
}

interface TestEmailRequest {
  recipientEmail: string;
  config: EmailConfig;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, config }: TestEmailRequest = await req.json();
    
    console.log("Sending test email to:", recipientEmail);
    console.log("Using provider:", config.provider);

    const testSubject = "Test Email from Full Circle HRMS";
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email Configuration Test</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>This is a test email from <strong>Full Circle HRMS</strong>.</p>
              <div class="success-badge">✓ Configuration Working</div>
              <p>If you received this email, your email configuration is set up correctly and ready to send notifications.</p>
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>Provider:</strong> ${config.provider === "resend" ? "Resend API" : "SMTP"}</li>
                <li><strong>From:</strong> ${config.provider === "resend" ? config.resendFromEmail : config.smtpFromEmail}</li>
                <li><strong>Sent to:</strong> ${recipientEmail}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is an automated test email. Please do not reply.</p>
              <p>Sent by Full Circle HRMS</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (config.provider === "resend") {
      if (!config.resendApiKey) {
        throw new Error("Resend API key is not configured");
      }

      const fromAddress = config.resendFromName 
        ? `${config.resendFromName} <${config.resendFromEmail}>`
        : config.resendFromEmail;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipientEmail],
          subject: testSubject,
          html: testHtml,
        }),
      });

      const resendData = await resendResponse.json();
      console.log("Resend response:", resendData);

      if (!resendResponse.ok) {
        throw new Error(resendData.message || "Failed to send email via Resend");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test email sent successfully via Resend",
          id: resendData.id 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else {
      // Send via SMTP using Gmail API for Gmail, or generic SMTP
      if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
        throw new Error("SMTP configuration is incomplete");
      }

      const fromEmail = config.smtpFromEmail || config.smtpUser;
      const fromName = config.smtpFromName || "Full Circle HRMS";

      // For Gmail, use Gmail's SMTP relay via their API
      if (config.smtpHost.includes("gmail")) {
        // Use nodemailer-compatible approach via external service
        // Since Deno doesn't have native nodemailer, we'll use a REST-based approach
        
        // Create the email in RFC 2822 format
        const boundary = "----=_Part_" + Math.random().toString(36).substr(2);
        const emailContent = [
          `From: ${fromName} <${fromEmail}>`,
          `To: ${recipientEmail}`,
          `Subject: ${testSubject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          ``,
          `This is a test email from Full Circle HRMS. Your email configuration is working correctly!`,
          ``,
          `--${boundary}`,
          `Content-Type: text/html; charset=UTF-8`,
          ``,
          testHtml,
          ``,
          `--${boundary}--`
        ].join("\r\n");

        // Base64 encode for Gmail API (URL-safe base64)
        const encodedEmail = btoa(emailContent)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        console.log("Attempting to send via Gmail SMTP...");
        console.log("SMTP Config:", { host: config.smtpHost, port: config.smtpPort, user: config.smtpUser });

        // Use SMTP2GO or similar service as relay, or implement basic SMTP
        // For now, let's try using a simple HTTP-based email service approach
        
        // Alternative: Use Mailgun-compatible SMTP or direct SMTP with TLS
        const smtpResult = await sendViaSMTP(config, recipientEmail, testSubject, testHtml, fromEmail, fromName);
        
        if (smtpResult.success) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Test email sent successfully via SMTP" 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          throw new Error(smtpResult.error || "Failed to send via SMTP");
        }
      }

      throw new Error("SMTP provider not fully supported. Please use Resend API for reliable email delivery, or ensure your SMTP settings are correct.");
    }

  } catch (error: any) {
    console.error("Error sending test email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send test email" 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Basic SMTP implementation using Deno's TCP with STARTTLS
async function sendViaSMTP(
  config: EmailConfig,
  to: string,
  subject: string,
  htmlBody: string,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    console.log(`Connecting to ${config.smtpHost}:${config.smtpPort}...`);
    
    // Connect to SMTP server
    const tcpConn = await Deno.connect({
      hostname: config.smtpHost,
      port: config.smtpPort,
    });
    
    // Use a union type for the connection
    let conn: Deno.TcpConn | Deno.TlsConn = tcpConn;

    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(4096);
      const n = await conn.read(buffer);
      if (n === null) return "";
      return decoder.decode(buffer.subarray(0, n)).trim();
    };

    const sendCommand = async (cmd: string): Promise<string> => {
      console.log(`> ${cmd.startsWith("AUTH") ? "AUTH ***" : cmd}`);
      await conn.write(encoder.encode(cmd + "\r\n"));
      const response = await readResponse();
      console.log(`< ${response.substring(0, 100)}`);
      return response;
    };

    // Read greeting
    let response = await readResponse();
    console.log("Greeting:", response.substring(0, 100));
    
    if (!response.startsWith("220")) {
      throw new Error("Invalid SMTP greeting: " + response);
    }

    // EHLO
    response = await sendCommand(`EHLO localhost`);
    if (!response.includes("250")) {
      throw new Error("EHLO failed: " + response);
    }

    // STARTTLS
    response = await sendCommand("STARTTLS");
    if (!response.startsWith("220")) {
      throw new Error("STARTTLS failed: " + response);
    }

    // Upgrade to TLS - need to cast for type compatibility
    const tlsConn = await Deno.startTls(tcpConn, { hostname: config.smtpHost });
    conn = tlsConn;
    console.log("TLS connection established");

    // EHLO again after TLS
    response = await sendCommand(`EHLO localhost`);
    if (!response.includes("250")) {
      throw new Error("EHLO after TLS failed: " + response);
    }

    // AUTH LOGIN
    response = await sendCommand("AUTH LOGIN");
    if (!response.startsWith("334")) {
      throw new Error("AUTH LOGIN failed: " + response);
    }

    // Send username (base64)
    response = await sendCommand(btoa(config.smtpUser));
    if (!response.startsWith("334")) {
      throw new Error("Username rejected: " + response);
    }

    // Send password (base64)
    response = await sendCommand(btoa(config.smtpPassword));
    if (!response.startsWith("235")) {
      throw new Error("Authentication failed: " + response);
    }

    console.log("Authentication successful!");

    // MAIL FROM
    response = await sendCommand(`MAIL FROM:<${fromEmail}>`);
    if (!response.startsWith("250")) {
      throw new Error("MAIL FROM failed: " + response);
    }

    // RCPT TO
    response = await sendCommand(`RCPT TO:<${to}>`);
    if (!response.startsWith("250")) {
      throw new Error("RCPT TO failed: " + response);
    }

    // DATA
    response = await sendCommand("DATA");
    if (!response.startsWith("354")) {
      throw new Error("DATA command failed: " + response);
    }

    // Send email content
    const boundary = "----=_Part_" + Math.random().toString(36).substr(2);
    const emailData = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      `This is a test email from Full Circle HRMS.`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlBody,
      ``,
      `--${boundary}--`,
      `.`
    ].join("\r\n");

    await conn.write(encoder.encode(emailData + "\r\n"));
    response = await readResponse();
    console.log("DATA response:", response);
    
    if (!response.startsWith("250")) {
      throw new Error("Email sending failed: " + response);
    }

    // QUIT
    await sendCommand("QUIT");
    conn.close();

    console.log("Email sent successfully!");
    return { success: true };

  } catch (error: any) {
    console.error("SMTP Error:", error);
    return { success: false, error: error.message };
  }
}

serve(handler);

-- Create email_templates table for managing email notification templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- leave_request_new, leave_approved, leave_rejected, ticket_new, ticket_resolved, attendance_late, payslip_generated, announcement_new, welcome_employee
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin and HR can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active email templates" 
ON public.email_templates 
FOR SELECT 
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default email templates
INSERT INTO public.email_templates (name, type, subject, content, is_default, is_active) VALUES
-- Leave templates
('Leave Request Submitted', 'leave_request_new', 'New Leave Request from {{employee_name}}', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">New Leave Request</h2>
    <p>Dear Admin,</p>
    <p><strong>{{employee_name}}</strong> has submitted a leave request that requires your attention.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Leave Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{leave_type}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>From:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{start_date}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>To:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{end_date}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Days:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{days}}</td></tr>
      <tr><td style="padding: 10px;"><strong>Reason:</strong></td><td style="padding: 10px;">{{reason}}</td></tr>
    </table>
    <a href="{{app_url}}/admin/leaves" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Review Request</a>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

('Leave Approved', 'leave_approved', 'Your Leave Request has been Approved', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #059669;">Leave Request Approved ✓</h2>
    <p>Dear {{recipient_name}},</p>
    <p>Great news! Your leave request has been <strong style="color: #059669;">approved</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Leave Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{leave_type}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>From:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{start_date}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>To:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{end_date}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Days:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{days}}</td></tr>
      <tr><td style="padding: 10px;"><strong>Approved By:</strong></td><td style="padding: 10px;">{{approved_by}}</td></tr>
    </table>
    {{#if comments}}<p><strong>Comments:</strong> {{comments}}</p>{{/if}}
    <p>Enjoy your time off!</p>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

('Leave Rejected', 'leave_rejected', 'Your Leave Request has been Rejected', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #dc2626;">Leave Request Rejected</h2>
    <p>Dear {{recipient_name}},</p>
    <p>Unfortunately, your leave request has been <strong style="color: #dc2626;">rejected</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Leave Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{leave_type}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>From:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{start_date}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>To:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{end_date}}</td></tr>
      <tr><td style="padding: 10px;"><strong>Days:</strong></td><td style="padding: 10px;">{{days}}</td></tr>
    </table>
    {{#if comments}}<p><strong>Reason:</strong> {{comments}}</p>{{/if}}
    <p>Please contact HR if you have any questions.</p>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

-- Helpdesk templates
('New Helpdesk Ticket', 'ticket_new', 'New Helpdesk Ticket: {{ticket_subject}}', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #d97706;">New Support Ticket</h2>
    <p>Dear Admin,</p>
    <p>A new support ticket has been submitted and requires attention.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ticket_subject}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Category:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ticket_category}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Priority:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span style="background: {{priority_color}}; color: white; padding: 2px 8px; border-radius: 4px;">{{ticket_priority}}</span></td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Submitted By:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{employee_name}}</td></tr>
      <tr><td style="padding: 10px;"><strong>Description:</strong></td><td style="padding: 10px;">{{ticket_description}}</td></tr>
    </table>
    <a href="{{app_url}}/admin/helpdesk" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Ticket</a>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

('Ticket Resolved', 'ticket_resolved', 'Your Support Ticket has been Resolved', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #059669;">Ticket Resolved ✓</h2>
    <p>Dear {{recipient_name}},</p>
    <p>Your support ticket has been <strong style="color: #059669;">resolved</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ticket_subject}}</td></tr>
      <tr><td style="padding: 10px;"><strong>Category:</strong></td><td style="padding: 10px;">{{ticket_category}}</td></tr>
    </table>
    <p>If you have any further questions, feel free to create a new ticket.</p>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

-- Payslip template
('Payslip Generated', 'payslip_generated', 'Your Payslip for {{pay_period}} is Ready', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">Payslip Available</h2>
    <p>Dear {{recipient_name}},</p>
    <p>Your payslip for <strong>{{pay_period}}</strong> is now available.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Pay Period:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{pay_period}}</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Pay Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{pay_date}}</td></tr>
      <tr><td style="padding: 10px;"><strong>Net Pay:</strong></td><td style="padding: 10px; font-size: 18px; font-weight: bold; color: #059669;">{{net_pay}}</td></tr>
    </table>
    <a href="{{app_url}}/employee/payslips" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Payslip</a>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

-- Welcome email template
('Welcome New Employee', 'welcome_employee', 'Welcome to {{company_name}}!', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to {{company_name}}!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">Hello, {{recipient_name}}! 👋</h2>
    <p>We are thrilled to have you join our team!</p>
    <p>Your employee account has been created. Here are your login details:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px;">
      <tr><td style="padding: 15px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">{{recipient_email}}</td></tr>
      <tr><td style="padding: 15px;"><strong>Temporary Password:</strong></td><td style="padding: 15px; font-family: monospace;">{{temp_password}}</td></tr>
    </table>
    <p><strong>Please change your password after your first login.</strong></p>
    <a href="{{app_url}}/auth" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">Login to HRMS</a>
    <p style="margin-top: 30px;">If you have any questions, please contact HR.</p>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true),

-- Announcement template
('New Announcement', 'announcement_new', '{{announcement_title}}', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">📢 {{announcement_title}}</h2>
    <p>Dear {{recipient_name}},</p>
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      {{announcement_content}}
    </div>
    <a href="{{app_url}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View in HRMS</a>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>', true, true);
-- Insert default email configuration setting
INSERT INTO public.system_settings (key, value, category, description)
VALUES (
  'email_config',
  '{
    "enabled": false,
    "provider": "resend",
    "resendFromEmail": "",
    "resendFromName": "",
    "smtpHost": "",
    "smtpPort": 587,
    "smtpUser": "",
    "smtpFromEmail": "",
    "smtpFromName": "",
    "smtpSecure": true,
    "lastTestedAt": null,
    "lastTestStatus": null,
    "lastTestMessage": null
  }'::jsonb,
  'email',
  'Email notification configuration for sending emails via Resend API or SMTP'
)
ON CONFLICT (key) DO NOTHING;
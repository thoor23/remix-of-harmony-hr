-- Update email_config to include API key and password fields
UPDATE public.system_settings 
SET value = jsonb_set(
  jsonb_set(value, '{resendApiKey}', '""'),
  '{smtpPassword}', '""'
)
WHERE key = 'email_config'
AND NOT (value ? 'resendApiKey');
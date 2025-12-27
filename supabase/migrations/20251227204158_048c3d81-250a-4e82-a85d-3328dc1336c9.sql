-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Admins can manage company assets"
ON storage.objects FOR ALL
USING (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Add company branding to system_settings
INSERT INTO system_settings (key, value, description, category)
VALUES (
  'company_branding',
  '{"companyName": "HRMS Portal", "companyLogo": null, "companyEmail": "", "companyPhone": "", "companyAddress": "", "companyWebsite": ""}',
  'Company branding and contact information',
  'company'
)
ON CONFLICT (key) DO NOTHING;
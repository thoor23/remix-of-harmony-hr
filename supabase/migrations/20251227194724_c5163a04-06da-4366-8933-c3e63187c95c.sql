-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Admin and HR can manage all documents in storage" 
ON storage.objects FOR ALL 
USING (bucket_id = 'documents' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role)));

CREATE POLICY "Employees can upload own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Employees can view own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR 
  (storage.foldername(name))[1] = auth.uid()::text
));

CREATE POLICY "Employees can delete own documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'documents' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR 
  (storage.foldername(name))[1] = auth.uid()::text
));

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID,
  performer_name TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
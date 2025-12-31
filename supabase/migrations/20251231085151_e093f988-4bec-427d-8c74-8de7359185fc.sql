-- Create recruitment-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruitment-documents', 'recruitment-documents', false);

-- RLS policies for recruitment documents
CREATE POLICY "Authenticated users can view recruitment documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'recruitment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload recruitment documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recruitment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own recruitment documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'recruitment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own recruitment documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'recruitment-documents' AND auth.role() = 'authenticated');
-- Create letter_templates table
CREATE TABLE public.letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'experience', 'relieving', 'increment', 'custom')),
  content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create generated_letters table
CREATE TABLE public.generated_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.letter_templates(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'sent')),
  metadata JSONB DEFAULT '{}'::jsonb,
  generated_by UUID,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS document_category TEXT DEFAULT 'employee_doc' CHECK (document_category IN ('employee_doc', 'policy', 'generated_letter')),
ADD COLUMN IF NOT EXISTS folder_path TEXT;

-- Enable RLS
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_letters ENABLE ROW LEVEL SECURITY;

-- Letter Templates Policies
CREATE POLICY "Admin and HR can manage templates" 
ON public.letter_templates FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active templates" 
ON public.letter_templates FOR SELECT 
USING (is_active = true);

-- Generated Letters Policies
CREATE POLICY "Admin and HR can manage all letters" 
ON public.generated_letters FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view their own letters" 
ON public.generated_letters FOR SELECT 
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Create updated_at trigger for letter_templates
CREATE TRIGGER update_letter_templates_updated_at
BEFORE UPDATE ON public.letter_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
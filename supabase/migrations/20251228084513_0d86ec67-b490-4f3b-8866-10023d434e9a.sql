-- Create announcement_templates table
CREATE TABLE public.announcement_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  target_audience TEXT NOT NULL DEFAULT 'all',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin and HR can manage announcement templates"
ON public.announcement_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active templates"
ON public.announcement_templates
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_announcement_templates_updated_at
BEFORE UPDATE ON public.announcement_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
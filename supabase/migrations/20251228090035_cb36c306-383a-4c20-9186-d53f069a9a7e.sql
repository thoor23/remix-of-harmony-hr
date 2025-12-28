-- Create announcement_banner_templates table
CREATE TABLE public.announcement_banner_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  priority_type TEXT NOT NULL DEFAULT 'all',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_banner_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin and HR can manage banner templates"
  ON public.announcement_banner_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active templates"
  ON public.announcement_banner_templates
  FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_banner_templates_updated_at
  BEFORE UPDATE ON public.announcement_banner_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default template
INSERT INTO public.announcement_banner_templates (name, html_content, is_default, priority_type)
VALUES (
  'Default Banner',
  '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px; border-radius: 8px; border: 1px solid {{priority_border}}; background: {{priority_bg}};">
  <div style="display: flex; align-items: flex-start; gap: 12px;">
    <span style="font-size: 20px;">{{type_icon}}</span>
    <div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <p style="font-weight: 600; font-size: 14px; margin: 0; color: {{priority_color}};">{{title}}</p>
        <span style="font-size: 12px; color: {{priority_color}}; opacity: 0.7; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 999px;">{{time_remaining}}</span>
      </div>
      <p style="font-size: 14px; color: {{priority_color}}; opacity: 0.85; margin: 4px 0 0 0;">{{content}}</p>
    </div>
  </div>
</div>',
  true,
  'all'
);
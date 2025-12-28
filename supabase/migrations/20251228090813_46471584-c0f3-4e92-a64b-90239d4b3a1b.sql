-- Add banner_template_id column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN banner_template_id uuid REFERENCES public.announcement_banner_templates(id) ON DELETE SET NULL;
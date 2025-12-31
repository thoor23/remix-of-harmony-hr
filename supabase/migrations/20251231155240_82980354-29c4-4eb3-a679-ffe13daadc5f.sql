-- Platform settings table for global super admin settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage platform settings
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (is_super_admin(auth.uid()));

-- Impersonation tokens table for login as company admin
CREATE TABLE IF NOT EXISTS public.impersonation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impersonation_tokens ENABLE ROW LEVEL SECURITY;

-- Only super admins can create/view impersonation tokens
CREATE POLICY "Super admins can manage impersonation tokens"
ON public.impersonation_tokens
FOR ALL
USING (is_super_admin(auth.uid()));

-- Platform announcements table for system-wide announcements
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Super admins can manage announcements
CREATE POLICY "Super admins can manage platform announcements"
ON public.platform_announcements
FOR ALL
USING (is_super_admin(auth.uid()));

-- All authenticated users can view active announcements
CREATE POLICY "Users can view active platform announcements"
ON public.platform_announcements
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, description, category) VALUES
('allow_self_registration', '{"enabled": false}', 'Allow companies to self-register', 'general'),
('require_email_verification', '{"enabled": true}', 'Require email verification for new users', 'security'),
('maintenance_mode', '{"enabled": false, "message": "System is under maintenance"}', 'Enable maintenance mode', 'general'),
('default_subscription_plan', '{"plan": "starter", "trial_days": 14}', 'Default subscription for new companies', 'subscription'),
('session_timeout', '{"minutes": 60}', 'Session timeout in minutes', 'security'),
('max_login_attempts', '{"attempts": 5, "lockout_minutes": 15}', 'Max login attempts before lockout', 'security')
ON CONFLICT (key) DO NOTHING;

-- Add updated_at trigger for platform_settings
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for platform_announcements
CREATE TRIGGER update_platform_announcements_updated_at
BEFORE UPDATE ON public.platform_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
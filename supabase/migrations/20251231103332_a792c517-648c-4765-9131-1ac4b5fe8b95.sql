-- Create status_history table to log health checks
CREATE TABLE public.status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name text NOT NULL,
  service_group text NOT NULL,
  status text NOT NULL DEFAULT 'operational',
  response_time_ms integer,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create status_incidents table for manual incident tracking
CREATE TABLE public.status_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'investigating',
  severity text NOT NULL DEFAULT 'minor',
  affected_services text[] DEFAULT '{}',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;

-- Public read access for status history (no auth required)
CREATE POLICY "Anyone can view status history" 
ON public.status_history 
FOR SELECT 
USING (true);

-- Public read access for incidents
CREATE POLICY "Anyone can view incidents" 
ON public.status_incidents 
FOR SELECT 
USING (true);

-- Only admins can manage incidents
CREATE POLICY "Admins can manage incidents" 
ON public.status_incidents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_status_history_checked_at ON public.status_history(checked_at DESC);
CREATE INDEX idx_status_history_service ON public.status_history(service_name, checked_at DESC);
CREATE INDEX idx_status_incidents_started_at ON public.status_incidents(started_at DESC);
-- Add scheduling columns to announcements table
ALTER TABLE public.announcements
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL,
ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.announcements.scheduled_at IS 'When the announcement should start appearing (null = immediate)';
COMMENT ON COLUMN public.announcements.expires_at IS 'When the announcement should stop appearing (null = never expires)';
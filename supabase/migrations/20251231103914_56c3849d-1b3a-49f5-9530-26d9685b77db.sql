-- Create status_subscribers table for email subscriptions
CREATE TABLE public.status_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for email lookups
CREATE INDEX idx_status_subscribers_email ON public.status_subscribers(email);
CREATE INDEX idx_status_subscribers_active ON public.status_subscribers(is_verified, unsubscribed_at) WHERE is_verified = true AND unsubscribed_at IS NULL;

-- Enable RLS
ALTER TABLE public.status_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public to subscribe (insert)
CREATE POLICY "Anyone can subscribe"
ON public.status_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to update for unsubscribe (only their own via token)
CREATE POLICY "Anyone can unsubscribe with token"
ON public.status_subscribers
FOR UPDATE
TO public
USING (verification_token IS NOT NULL)
WITH CHECK (true);

-- Only admins can view all subscribers
CREATE POLICY "Admins can view all subscribers"
ON public.status_subscribers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add previous_status column to track status changes
ALTER TABLE public.status_history ADD COLUMN IF NOT EXISTS previous_status TEXT;
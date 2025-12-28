-- RLS policies for users table - only service role can access (no public policies)
-- This is intentional - the backend Edge Functions use service role key
-- No policies needed as we want to block all direct client access

-- RLS policies for refresh_tokens table - only service role can access
-- This is also intentional - JWT management is backend-only

-- However, we need to create explicit "deny all" behavior by having RLS enabled with no policies
-- The service role bypasses RLS, so our Edge Functions will work
-- But we should document this is intentional

-- Add a comment to document the security model
COMMENT ON TABLE public.users IS 'Custom authentication users table. RLS enabled with no policies means only service role (backend) can access. This is intentional for security.';
COMMENT ON TABLE public.refresh_tokens IS 'JWT refresh tokens table. RLS enabled with no policies means only service role (backend) can access. This is intentional for security.';
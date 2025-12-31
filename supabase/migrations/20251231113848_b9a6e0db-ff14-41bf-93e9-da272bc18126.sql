-- Add missing RLS policies for users and refresh_tokens tables

-- 1. Add RLS policies for users table
CREATE POLICY "Users can read own record" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update own record" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. Add RLS policies for refresh_tokens table
CREATE POLICY "Users can read own tokens" 
ON public.refresh_tokens 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens" 
ON public.refresh_tokens 
FOR DELETE 
USING (user_id = auth.uid());

-- 3. Fix notifications INSERT policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users can create own notifications or admins for anyone" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr'::app_role)
);

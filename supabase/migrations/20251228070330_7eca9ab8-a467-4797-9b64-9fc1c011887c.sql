-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Admin and HR can create notifications" ON public.notifications;

-- Create a new policy that allows any authenticated user to create notifications
-- This is needed for employees to notify admins about leave requests, tickets, etc.
CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
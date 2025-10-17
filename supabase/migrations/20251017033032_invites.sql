-- This migration consolidates all changes related to the new group invite system.

-- 1. Clean up obsolete tables from the old invite system.
DROP TABLE IF EXISTS public.invites;

-- 2. Add the RPC function for the client-side handler to add an existing user to a group.
CREATE OR REPLACE FUNCTION public.add_user_to_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (p_group_id, auth.uid(), 'member', 'active')
  ON CONFLICT (group_id, user_id) DO NOTHING;
END;
$$;

-- 3. Add the helper function for the Edge Function to securely check if a user exists by email.
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE email = p_email;
$$;

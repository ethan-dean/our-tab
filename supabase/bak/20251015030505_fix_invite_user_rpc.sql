-- 1. Enable the HTTP extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Correct the invite_user function to use the http extension
CREATE OR REPLACE FUNCTION public.invite_user(p_group_id uuid, p_invitee_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitee_id uuid;
  project_url text;
  service_key text;
BEGIN
  -- Get the project URL and service role key from the vault
  SELECT decrypted_secret INTO project_url FROM vault.secrets WHERE name = 'supabase.url';
  SELECT decrypted_secret INTO service_key FROM vault.secrets WHERE name = 'supabase.service_role_key';

  -- Check if a user with this email already exists
  SELECT id INTO v_invitee_id FROM auth.users WHERE email = p_invitee_email;

  -- Use the http extension to make a direct request to the Supabase admin API
  PERFORM http_post(
    project_url || '/auth/v1/invite',
    jsonb_build_object('email', p_invitee_email),
    'application/json',
    jsonb_build_object(
        'apikey', service_key,
        'Authorization', 'Bearer ' || service_key
    )
  );

  -- Record the invite in our public table
  INSERT INTO public.invites (group_id, inviter_id, invitee_email, status)
  VALUES (p_group_id, auth.uid(), p_invitee_email, 'pending');

  -- If the user already exists, also create an in-app notification for them
  IF v_invitee_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, triggering_user_id, group_id, type)
    VALUES (v_invitee_id, auth.uid(), p_group_id, 'group_invite');
  END IF;

END;
$$;
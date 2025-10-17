-- 1. Create the new RPC function to send an email invite
CREATE OR REPLACE FUNCTION public.invite_user(p_group_id uuid, p_invitee_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: This function needs elevated privileges to call the admin API
AS $$
BEGIN
  -- Use the admin API to send an invitation email. This will create a new user if they don't exist.
  -- The user will get a magic link to sign in and set their password.
  PERFORM supabase.auth.admin.invite_user_by_email(p_invitee_email);

  -- Record the invite in our public table so we can link them to the group upon confirmation
  INSERT INTO public.invites (group_id, inviter_id, invitee_email, status)
  VALUES (p_group_id, auth.uid(), p_invitee_email, 'pending');

END;
$$;

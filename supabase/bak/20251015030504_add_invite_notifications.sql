-- 1. Update the invite_user function to handle existing users
CREATE OR REPLACE FUNCTION public.invite_user(p_group_id uuid, p_invitee_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitee_id uuid;
BEGIN
  -- Check if a user with this email already exists
  SELECT id INTO v_invitee_id FROM auth.users WHERE email = p_invitee_email;

  -- Always send the email invite, as it works for both new and existing users
  PERFORM supabase.auth.admin.invite_user_by_email(p_invitee_email);

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

-- 2. Add the new notification type to the ENUM
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'group_invite';

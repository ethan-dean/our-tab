-- 0. Helper function to check for active group membership
CREATE OR REPLACE FUNCTION public.is_active_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND status = 'active'
  );
END;
$$;

-- 1. Drop the overly permissive RLS policy on the invites table.
DROP POLICY IF EXISTS "Allow all actions for authenticated users" ON public.invites;

-- 2. Re-create the original, more secure policies for the invites table.

-- Policy for INSERT: Only active members of a group can create an invite for that group.
CREATE POLICY "Active group members can create invites"
ON "public"."invites"
AS permissive
FOR INSERT
TO public
WITH CHECK (is_active_group_member(group_id, auth.uid()));

-- Policy for SELECT: Group members can see all invites for their group, and an invitee can see their own invites.
CREATE POLICY "Group members and invitees can see invites"
ON "public"."invites"
AS permissive
FOR SELECT
TO public
USING (
  is_active_group_member(group_id, auth.uid()) OR
  (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Policy for UPDATE: Only the invitee can accept or decline their own invite.
CREATE POLICY "Invitees can accept or decline their own invites"
ON "public"."invites"
AS permissive
FOR UPDATE
TO public
USING (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 3. Function and Trigger for creating a user profile on new user sign up.

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create a profile when a new user signs up
CREATE TRIGGER on_new_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_public_profile_for_new_user();

-- 4. Notification Functions and Triggers

-- For new expenses
CREATE OR REPLACE FUNCTION public.handle_new_expense_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
  SELECT
      ps.ower_id,
      NEW.author_id,
      NEW.id,
      'new_expense'
  FROM public.post_splits ps
  WHERE ps.post_id = NEW.id AND ps.ower_id != NEW.author_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_expense
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.type = 'expense')
  EXECUTE FUNCTION public.handle_new_expense_notification();

-- For edited posts
CREATE OR REPLACE FUNCTION public.handle_edited_post_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    involved_user_id UUID;
    v_payer_id UUID;
BEGIN
    IF (NEW.changes->>'action') = 'edit' THEN
        SELECT payer_id INTO v_payer_id FROM public.posts WHERE id = NEW.post_id;

        IF v_payer_id != NEW.editor_id THEN
            INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
            VALUES (v_payer_id, NEW.editor_id, NEW.post_id, 'expense_edited');
        END IF;

        FOR involved_user_id IN
            SELECT ower_id FROM public.post_splits WHERE post_id = NEW.post_id
        LOOP
            IF involved_user_id != NEW.editor_id THEN
                INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
                VALUES (involved_user_id, NEW.editor_id, NEW.post_id, 'expense_edited');
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_edited
  AFTER INSERT ON public.post_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_edited_post_notification();

-- For settlement requests
CREATE OR REPLACE FUNCTION public.handle_settlement_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
    SELECT
        ps.ower_id,
        NEW.author_id,
        NEW.id,
        'settlement_request'
    FROM public.post_splits ps
    WHERE ps.post_id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_settlement_request
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.type = 'settlement' AND NEW.status = 'pending_confirmation')
  EXECUTE FUNCTION public.handle_settlement_request_notification();

-- For confirmed settlements
CREATE OR REPLACE FUNCTION public.handle_settlement_confirmed_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipient_id UUID;
BEGIN
    v_recipient_id := auth.uid();

    INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
    VALUES (NEW.payer_id, v_recipient_id, NEW.id, 'settlement_confirmed');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_settlement_confirmed
  AFTER UPDATE ON public.posts
  FOR EACH ROW
  WHEN (OLD.status = 'pending_confirmation' AND NEW.status = 'active')
  EXECUTE FUNCTION public.handle_settlement_confirmed_notification();

-- 5. Database View for calculating group balances
CREATE OR REPLACE VIEW public.group_balances AS
-- This view calculates the net balance for each active member in a group.
-- It sums up everything a user has paid for (expenses, settlements) and subtracts everything they owe.
SELECT
  gm.group_id,
  gm.user_id,
  -- Total amount this user has paid for others (expenses and settlements where they are the payer)
  COALESCE(SUM(p.total_amount) FILTER (WHERE p.payer_id = gm.user_id), 0) AS total_paid,
  -- Total amount this user owes from being included in expense or settlement splits
  COALESCE(SUM(ps.amount) FILTER (WHERE ps.ower_id = gm.user_id), 0) AS total_owed,
  -- Net balance: a positive value means the user is owed money, a negative value means they owe money.
  (COALESCE(SUM(p.total_amount) FILTER (WHERE p.payer_id = gm.user_id), 0) - COALESCE(SUM(ps.amount) FILTER (WHERE ps.ower_id = gm.user_id), 0)) AS net_balance
FROM
  public.group_members gm
LEFT JOIN
  public.posts p ON gm.group_id = p.group_id AND p.status = 'active'
LEFT JOIN
  public.post_splits ps ON p.id = ps.post_id
WHERE
  gm.status = 'active'
GROUP BY
  gm.group_id, gm.user_id;
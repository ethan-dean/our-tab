-- ### Missing Triggers ###

-- 1. Trigger to create a public profile for a new user
CREATE TRIGGER on_new_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_public_profile_for_new_user();

-- 2. Trigger to anonymize a user's profile when they are deleted
CREATE TRIGGER on_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.anonymize_user_on_delete();

-- 3. Trigger for settlement confirmed notifications
CREATE TRIGGER on_settlement_confirmed
AFTER UPDATE ON public.posts
FOR EACH ROW
WHEN (OLD.status = 'pending_confirmation'::post_status AND NEW.status = 'active'::post_status)
EXECUTE FUNCTION public.handle_settlement_confirmed_notification();


-- ### Missing Database Functions (RPCs) ###

-- 1. Function to edit a post
CREATE OR REPLACE FUNCTION public.edit_post(
    p_post_id uuid,
    p_title text,
    p_total_amount numeric,
    p_payer_id uuid,
    p_image_url text,
    p_splits jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    split_data JSONB;
    original_data JSONB;
BEGIN
    -- Capture the original state for the history log
    SELECT to_jsonb(posts) INTO original_data FROM public.posts WHERE id = p_post_id;

    -- Update the main post record
    UPDATE public.posts
    SET
        title = p_title,
        total_amount = p_total_amount,
        payer_id = p_payer_id,
        image_url = p_image_url
    WHERE id = p_post_id;

    -- Remove old splits
    DELETE FROM public.post_splits WHERE post_id = p_post_id;

    -- Create new split records from the JSONB array
    FOR split_data IN SELECT * FROM jsonb_array_elements(p_splits)
    LOOP
        INSERT INTO public.post_splits (post_id, ower_id, amount)
        VALUES (p_post_id, (split_data->>'ower_id')::UUID, (split_data->>'amount')::NUMERIC);
    END LOOP;

    -- Create the edit history record
    INSERT INTO public.post_history (post_id, editor_id, changes)
    VALUES (p_post_id, auth.uid(), jsonb_build_object(
        'action', 'edit',
        'before', original_data,
        'after', to_jsonb((SELECT posts FROM public.posts WHERE id = p_post_id))
    ));
END;
$$;

-- 2. Function for an admin to transfer role and leave a group
CREATE OR REPLACE FUNCTION public.transfer_admin_and_leave(
    p_group_id uuid,
    p_new_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    current_admin_id UUID := auth.uid();
BEGIN
    -- Verify the current user is an admin
    IF (public.get_user_role_in_group(p_group_id, current_admin_id) != 'admin') THEN
        RAISE EXCEPTION 'Only an admin can perform this action.';
    END IF;

    -- Verify the new admin is an active member of the group
    IF NOT public.is_active_group_member(p_group_id, p_new_admin_id) THEN
        RAISE EXCEPTION 'New admin must be an active member of the group.';
    END IF;

    -- Start transaction
    -- Promote the new admin
    UPDATE public.group_members
    SET role = 'admin'
    WHERE group_id = p_group_id AND user_id = p_new_admin_id;

    -- Demote and deactivate the current admin
    UPDATE public.group_members
    SET
        role = 'member',
        status = 'inactive',
        left_at = now()
    WHERE group_id = p_group_id AND user_id = current_admin_id;
END;
$$;


-- ### Missing/Improved Row Level Security (RLS) Policies ###

-- 1. Stricter policies for `profiles` table
-- The SELECT and UPDATE policies already exist and are correct. We only need to add policies to prevent direct insertion and deletion.

CREATE POLICY "Disallow direct profile insertion"
ON public.profiles
FOR INSERT TO public
WITH CHECK (false);

CREATE POLICY "Disallow direct profile deletion"
ON public.profiles
FOR DELETE TO public
USING (false);


-- 2. Stricter policies for `groups` table
CREATE POLICY "Disallow group deletion"
ON public.groups
FOR DELETE TO public
USING (false);

CREATE POLICY "Disallow group updates"
ON public.groups
FOR UPDATE TO public
USING (false);


-- 3. Stricter policies for `post_history` table
CREATE POLICY "Disallow post_history modification"
ON public.post_history
FOR UPDATE TO public
USING (false);

CREATE POLICY "Disallow post_history deletion"
ON public.post_history
FOR DELETE TO public
USING (false);

-- Allow inserts by authenticated users (will be controlled by RPC logic)
CREATE POLICY "Allow authorized history insertion"
ON public.post_history
FOR INSERT TO authenticated
WITH CHECK (true);

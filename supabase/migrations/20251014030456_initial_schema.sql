create type "public"."group_role" as enum ('admin', 'member');

create type "public"."invite_status" as enum ('pending', 'accepted', 'declined');

create type "public"."member_status" as enum ('active', 'inactive');

create type "public"."notification_type" as enum ('new_expense', 'expense_edited', 'settlement_request', 'settlement_confirmed');

create type "public"."post_status" as enum ('active', 'pending_amount', 'pending_confirmation', 'invalid');

create type "public"."post_type" as enum ('expense', 'settlement', 'simplification_event');

create sequence "public"."notifications_id_seq";

create sequence "public"."post_history_id_seq";

create table "public"."group_members" (
    "group_id" uuid not null,
    "user_id" uuid not null,
    "role" group_role not null default 'member'::group_role,
    "status" member_status not null default 'active'::member_status,
    "joined_at" timestamp with time zone default now(),
    "left_at" timestamp with time zone
);


alter table "public"."group_members" enable row level security;

create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."groups" enable row level security;

create table "public"."invites" (
    "id" uuid not null default gen_random_uuid(),
    "group_id" uuid,
    "inviter_id" uuid,
    "invitee_email" text not null,
    "status" invite_status not null default 'pending'::invite_status,
    "created_at" timestamp with time zone default now()
);


alter table "public"."invites" enable row level security;

create table "public"."notifications" (
    "id" bigint not null default nextval('notifications_id_seq'::regclass),
    "user_id" uuid,
    "triggering_user_id" uuid,
    "post_id" uuid,
    "type" notification_type not null,
    "is_read" boolean not null default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."post_history" (
    "id" bigint not null default nextval('post_history_id_seq'::regclass),
    "post_id" uuid,
    "editor_id" uuid,
    "changes" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."post_history" enable row level security;

create table "public"."post_splits" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid,
    "ower_id" uuid,
    "amount" numeric(10,2) not null
);


alter table "public"."post_splits" enable row level security;

create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "group_id" uuid,
    "author_id" uuid,
    "type" post_type not null,
    "title" text,
    "total_amount" numeric(10,2),
    "payer_id" uuid,
    "image_url" text,
    "status" post_status not null default 'active'::post_status,
    "created_at" timestamp with time zone default now()
);


alter table "public"."posts" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "payment_info" jsonb,
    "updated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."post_history_id_seq" owned by "public"."post_history"."id";

CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (group_id, user_id);

CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id);

CREATE UNIQUE INDEX invites_pkey ON public.invites USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX post_history_pkey ON public.post_history USING btree (id);

CREATE UNIQUE INDEX post_splits_pkey ON public.post_splits USING btree (id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."group_members" add constraint "group_members_pkey" PRIMARY KEY using index "group_members_pkey";

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";

alter table "public"."invites" add constraint "invites_pkey" PRIMARY KEY using index "invites_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."post_history" add constraint "post_history_pkey" PRIMARY KEY using index "post_history_pkey";

alter table "public"."post_splits" add constraint "post_splits_pkey" PRIMARY KEY using index "post_splits_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."group_members" add constraint "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;

alter table "public"."group_members" validate constraint "group_members_group_id_fkey";

alter table "public"."group_members" add constraint "group_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."group_members" validate constraint "group_members_user_id_fkey";

alter table "public"."groups" add constraint "groups_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."groups" validate constraint "groups_created_by_fkey";

alter table "public"."invites" add constraint "invites_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;

alter table "public"."invites" validate constraint "invites_group_id_fkey";

alter table "public"."invites" add constraint "invites_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES profiles(id) not valid;

alter table "public"."invites" validate constraint "invites_inviter_id_fkey";

alter table "public"."notifications" add constraint "notifications_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_post_id_fkey";

alter table "public"."notifications" add constraint "notifications_triggering_user_id_fkey" FOREIGN KEY (triggering_user_id) REFERENCES profiles(id) not valid;

alter table "public"."notifications" validate constraint "notifications_triggering_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."post_history" add constraint "post_history_editor_id_fkey" FOREIGN KEY (editor_id) REFERENCES profiles(id) not valid;

alter table "public"."post_history" validate constraint "post_history_editor_id_fkey";

alter table "public"."post_history" add constraint "post_history_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_history" validate constraint "post_history_post_id_fkey";

alter table "public"."post_splits" add constraint "post_splits_ower_id_fkey" FOREIGN KEY (ower_id) REFERENCES profiles(id) not valid;

alter table "public"."post_splits" validate constraint "post_splits_ower_id_fkey";

alter table "public"."post_splits" add constraint "post_splits_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_splits" validate constraint "post_splits_post_id_fkey";

alter table "public"."posts" add constraint "posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES profiles(id) not valid;

alter table "public"."posts" validate constraint "posts_author_id_fkey";

alter table "public"."posts" add constraint "posts_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_group_id_fkey";

alter table "public"."posts" add constraint "posts_payer_id_fkey" FOREIGN KEY (payer_id) REFERENCES profiles(id) not valid;

alter table "public"."posts" validate constraint "posts_payer_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_invite(p_invite_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_group_id UUID;
    v_invitee_email TEXT;
BEGIN
    -- Find the invite and verify the current user is the invitee
    SELECT group_id, invitee_email INTO v_group_id, v_invitee_email
    FROM public.invites
    WHERE id = p_invite_id AND status = 'pending';

    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Invite not found or already actioned.';
    END IF;

    IF v_invitee_email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'You are not authorized to accept this invite.';
    END IF;

    -- Add user to the group
    INSERT INTO public.group_members (group_id, user_id, role, status)
    VALUES (v_group_id, auth.uid(), 'member', 'active');

    -- Update the invite status
    UPDATE public.invites SET status = 'accepted' WHERE id = p_invite_id;

    RETURN v_group_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.anonymize_user_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.profiles
    SET
        first_name = 'Former',
        last_name = 'User',
        payment_info = NULL
    WHERE id = OLD.id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_group(p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_group_id UUID;
BEGIN
    -- Create the new group
    INSERT INTO public.groups (name, created_by)
    VALUES (p_name, auth.uid())
    RETURNING id INTO new_group_id;

    -- Add the creator as the first admin member
    INSERT INTO public.group_members (group_id, user_id, role, status)
    VALUES (new_group_id, auth.uid(), 'admin', 'active');

    RETURN new_group_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_post(p_group_id uuid, p_title text, p_total_amount numeric, p_payer_id uuid, p_image_url text, p_splits jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_post_id UUID;
    split_data JSONB;
BEGIN
    -- Create the main post record
    INSERT INTO public.posts (group_id, author_id, type, title, total_amount, payer_id, image_url, status)
    VALUES (p_group_id, auth.uid(), 'expense', p_title, p_total_amount, p_payer_id, p_image_url, 'active')
    RETURNING id INTO new_post_id;

    -- Create the split records from the JSONB array
    FOR split_data IN SELECT * FROM jsonb_array_elements(p_splits)
    LOOP
        INSERT INTO public.post_splits (post_id, ower_id, amount)
        VALUES (new_post_id, (split_data->>'ower_id')::UUID, (split_data->>'amount')::NUMERIC);
    END LOOP;

    -- Create the initial history record
    INSERT INTO public.post_history (post_id, editor_id, changes)
    VALUES (new_post_id, auth.uid(), jsonb_build_object('action', 'create'));

    RETURN new_post_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'lastName'
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_settlement(p_group_id uuid, p_recipient_id uuid, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_post_id UUID;
BEGIN
    IF p_recipient_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot send a settlement to yourself.';
    END IF;

    -- Create a settlement post with 'pending_confirmation' status
    INSERT INTO public.posts (group_id, author_id, type, title, total_amount, payer_id, status)
    VALUES (
        p_group_id,
        auth.uid(),
        'settlement',
        'Settlement',
        p_amount,
        auth.uid(), -- The sender is the payer
        'pending_confirmation'
    ) RETURNING id INTO new_post_id;

    -- The recipient is the "ower" of this credit
    INSERT INTO public.post_splits (post_id, ower_id, amount)
    VALUES (new_post_id, p_recipient_id, p_amount);

    RETURN new_post_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.decline_invite(p_invite_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Verify the current user is the invitee
    IF NOT EXISTS (
        SELECT 1 FROM public.invites
        WHERE id = p_invite_id
          AND status = 'pending'
          AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Invite not found or you are not authorized to action it.';
    END IF;

    -- Update the invite status
    UPDATE public.invites SET status = 'declined' WHERE id = p_invite_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role_in_group(p_group_id uuid, p_user_id uuid)
 RETURNS group_role
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_role public.group_role;
BEGIN
    SELECT role INTO v_role
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id;
    RETURN v_role;
END;
$function$
;

create or replace view "public"."group_balances" as  SELECT g.id AS group_id,
    gm.user_id,
    COALESCE(sum(ps.amount) FILTER (WHERE (p.payer_id <> gm.user_id)), (0)::numeric) AS total_owed,
    COALESCE(sum(p.total_amount) FILTER (WHERE ((p.payer_id = gm.user_id) AND (p.type = 'expense'::post_type))), (0)::numeric) AS total_paid,
    COALESCE(sum(ps_settle.amount) FILTER (WHERE (ps_settle.ower_id = gm.user_id)), (0)::numeric) AS total_settled,
    (COALESCE(sum(p.total_amount) FILTER (WHERE ((p.payer_id = gm.user_id) AND (p.type = 'expense'::post_type))), (0)::numeric) - COALESCE(sum(ps.amount) FILTER (WHERE (p.payer_id <> gm.user_id)), (0)::numeric)) AS net_balance
   FROM (((((groups g
     JOIN group_members gm ON ((g.id = gm.group_id)))
     LEFT JOIN posts p ON (((g.id = p.group_id) AND (p.status = 'active'::post_status))))
     LEFT JOIN post_splits ps ON (((p.id = ps.post_id) AND (ps.ower_id = gm.user_id))))
     LEFT JOIN posts p_settle ON (((g.id = p_settle.group_id) AND (p_settle.type = 'settlement'::post_type) AND (p_settle.status = 'active'::post_status))))
     LEFT JOIN post_splits ps_settle ON ((p_settle.id = ps_settle.post_id)))
  WHERE (gm.status = 'active'::member_status)
  GROUP BY g.id, gm.user_id;


CREATE OR REPLACE FUNCTION public.handle_edited_post_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    involved_user RECORD;
BEGIN
    -- This trigger fires on insert into post_history.
    -- We only care about 'edit' actions.
    IF (NEW.changes->>'action') = 'edit' THEN
        -- Loop through all users involved in the post (payer and owers)
        FOR involved_user IN
            SELECT payer_id AS user_id FROM public.posts WHERE id = NEW.post_id
            UNION
            SELECT ower_id AS user_id FROM public.post_splits WHERE post_id = NEW.post_id
        LOOP
            -- Create a notification if the user is not the one who made the edit
            IF involved_user.user_id != NEW.editor_id THEN
                INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
                VALUES (involved_user.user_id, NEW.editor_id, NEW.post_id, 'expense_edited');
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_expense_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_settlement_confirmed_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_recipient_id UUID;
BEGIN
    -- Find the recipient (the one who confirmed the action)
    SELECT ower_id INTO v_recipient_id
    FROM public.post_splits
    WHERE post_id = NEW.id;

    -- Notify the original sender (the payer)
    INSERT INTO public.notifications (user_id, triggering_user_id, post_id, type)
    VALUES (NEW.payer_id, v_recipient_id, NEW.id, 'settlement_confirmed');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_settlement_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_active_group_member(p_group_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_id = p_group_id AND user_id = p_user_id AND status = 'active'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notifications_as_read()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE user_id = auth.uid() AND is_read = false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_settlement(p_post_id uuid, p_action text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_recipient_id UUID;
    v_post_status public.post_status;
BEGIN
    -- Verify the post is a pending settlement and get the recipient
    SELECT ps.ower_id, p.status INTO v_recipient_id, v_post_status
    FROM public.posts p
    JOIN public.post_splits ps ON p.id = ps.post_id
    WHERE p.id = p_post_id AND p.type = 'settlement';

    IF v_recipient_id IS NULL THEN
        RAISE EXCEPTION 'Settlement post not found.';
    END IF;

    IF v_post_status != 'pending_confirmation' THEN
        RAISE EXCEPTION 'Settlement is not pending confirmation.';
    END IF;

    IF v_recipient_id != auth.uid() THEN
        RAISE EXCEPTION 'You are not authorized to resolve this settlement.';
    END IF;

    -- Update the post status based on the action
    IF p_action = 'confirm' THEN
        UPDATE public.posts SET status = 'active' WHERE id = p_post_id;
    ELSIF p_action = 'deny' THEN
        UPDATE public.posts SET status = 'invalid' WHERE id = p_post_id;
    ELSE
        RAISE EXCEPTION 'Invalid action. Must be "confirm" or "deny".';
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.simplify_group_debts(p_group_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    debtors RECORD;
    creditors RECORD;
    payment_amount NUMERIC;
    simplified_payments JSONB := '[]'::JSONB;
BEGIN
    -- Verify the user is an admin of the group
    IF (public.get_user_role_in_group(p_group_id, auth.uid()) != 'admin') THEN
        RAISE EXCEPTION 'Only group admins can simplify debts.';
    END IF;

    -- Use temporary tables to hold debtors and creditors
    CREATE TEMP TABLE temp_debtors AS
    SELECT user_id, net_balance FROM public.group_balances
    WHERE group_id = p_group_id AND net_balance < 0
    ORDER BY net_balance ASC;

    CREATE TEMP TABLE temp_creditors AS
    SELECT user_id, net_balance FROM public.group_balances
    WHERE group_id = p_group_id AND net_balance > 0
    ORDER BY net_balance DESC;

    -- Loop until all debts are settled
    WHILE (SELECT COUNT(*) FROM temp_debtors) > 0 AND (SELECT COUNT(*) FROM temp_creditors) > 0 LOOP
        -- Get the largest debtor and creditor
        SELECT * INTO debtors FROM temp_debtors LIMIT 1;
        SELECT * INTO creditors FROM temp_creditors LIMIT 1;

        payment_amount := LEAST(abs(debtors.net_balance), creditors.net_balance);

        -- Create an auto-confirmed settlement post for this simplified payment
        INSERT INTO public.posts (group_id, author_id, type, title, total_amount, payer_id, status)
        VALUES (p_group_id, auth.uid(), 'settlement', 'Simplified Settlement', payment_amount, debtors.user_id,
'active')
        RETURNING id INTO simplified_payments; -- Just to have a record

        INSERT INTO public.post_splits (post_id, ower_id, amount)
        SELECT id, creditors.user_id, payment_amount FROM public.posts WHERE id = simplified_payments;

        -- Update balances in temp tables
        UPDATE temp_debtors SET net_balance = net_balance + payment_amount WHERE user_id = debtors.user_id;
        UPDATE temp_creditors SET net_balance = net_balance - payment_amount WHERE user_id = creditors.user_id;

        -- Remove settled users
        DELETE FROM temp_debtors WHERE net_balance >= 0;
        DELETE FROM temp_creditors WHERE net_balance <= 0;
    END LOOP;

    -- Create a summary post for the event
    INSERT INTO public.posts (group_id, author_id, type, title, status)
    VALUES (p_group_id, auth.uid(), 'simplification_event', 'Debts have been simplified', 'active');

    DROP TABLE temp_debtors;
    DROP TABLE temp_creditors;
END;
$function$
;

grant delete on table "public"."group_members" to "anon";

grant insert on table "public"."group_members" to "anon";

grant references on table "public"."group_members" to "anon";

grant select on table "public"."group_members" to "anon";

grant trigger on table "public"."group_members" to "anon";

grant truncate on table "public"."group_members" to "anon";

grant update on table "public"."group_members" to "anon";

grant delete on table "public"."group_members" to "authenticated";

grant insert on table "public"."group_members" to "authenticated";

grant references on table "public"."group_members" to "authenticated";

grant select on table "public"."group_members" to "authenticated";

grant trigger on table "public"."group_members" to "authenticated";

grant truncate on table "public"."group_members" to "authenticated";

grant update on table "public"."group_members" to "authenticated";

grant delete on table "public"."group_members" to "service_role";

grant insert on table "public"."group_members" to "service_role";

grant references on table "public"."group_members" to "service_role";

grant select on table "public"."group_members" to "service_role";

grant trigger on table "public"."group_members" to "service_role";

grant truncate on table "public"."group_members" to "service_role";

grant update on table "public"."group_members" to "service_role";

grant delete on table "public"."groups" to "anon";

grant insert on table "public"."groups" to "anon";

grant references on table "public"."groups" to "anon";

grant select on table "public"."groups" to "anon";

grant trigger on table "public"."groups" to "anon";

grant truncate on table "public"."groups" to "anon";

grant update on table "public"."groups" to "anon";

grant delete on table "public"."groups" to "authenticated";

grant insert on table "public"."groups" to "authenticated";

grant references on table "public"."groups" to "authenticated";

grant select on table "public"."groups" to "authenticated";

grant trigger on table "public"."groups" to "authenticated";

grant truncate on table "public"."groups" to "authenticated";

grant update on table "public"."groups" to "authenticated";

grant delete on table "public"."groups" to "service_role";

grant insert on table "public"."groups" to "service_role";

grant references on table "public"."groups" to "service_role";

grant select on table "public"."groups" to "service_role";

grant trigger on table "public"."groups" to "service_role";

grant truncate on table "public"."groups" to "service_role";

grant update on table "public"."groups" to "service_role";

grant delete on table "public"."invites" to "anon";

grant insert on table "public"."invites" to "anon";

grant references on table "public"."invites" to "anon";

grant select on table "public"."invites" to "anon";

grant trigger on table "public"."invites" to "anon";

grant truncate on table "public"."invites" to "anon";

grant update on table "public"."invites" to "anon";

grant delete on table "public"."invites" to "authenticated";

grant insert on table "public"."invites" to "authenticated";

grant references on table "public"."invites" to "authenticated";

grant select on table "public"."invites" to "authenticated";

grant trigger on table "public"."invites" to "authenticated";

grant truncate on table "public"."invites" to "authenticated";

grant update on table "public"."invites" to "authenticated";

grant delete on table "public"."invites" to "service_role";

grant insert on table "public"."invites" to "service_role";

grant references on table "public"."invites" to "service_role";

grant select on table "public"."invites" to "service_role";

grant trigger on table "public"."invites" to "service_role";

grant truncate on table "public"."invites" to "service_role";

grant update on table "public"."invites" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."post_history" to "anon";

grant insert on table "public"."post_history" to "anon";

grant references on table "public"."post_history" to "anon";

grant select on table "public"."post_history" to "anon";

grant trigger on table "public"."post_history" to "anon";

grant truncate on table "public"."post_history" to "anon";

grant update on table "public"."post_history" to "anon";

grant delete on table "public"."post_history" to "authenticated";

grant insert on table "public"."post_history" to "authenticated";

grant references on table "public"."post_history" to "authenticated";

grant select on table "public"."post_history" to "authenticated";

grant trigger on table "public"."post_history" to "authenticated";

grant truncate on table "public"."post_history" to "authenticated";

grant update on table "public"."post_history" to "authenticated";

grant delete on table "public"."post_history" to "service_role";

grant insert on table "public"."post_history" to "service_role";

grant references on table "public"."post_history" to "service_role";

grant select on table "public"."post_history" to "service_role";

grant trigger on table "public"."post_history" to "service_role";

grant truncate on table "public"."post_history" to "service_role";

grant update on table "public"."post_history" to "service_role";

grant delete on table "public"."post_splits" to "anon";

grant insert on table "public"."post_splits" to "anon";

grant references on table "public"."post_splits" to "anon";

grant select on table "public"."post_splits" to "anon";

grant trigger on table "public"."post_splits" to "anon";

grant truncate on table "public"."post_splits" to "anon";

grant update on table "public"."post_splits" to "anon";

grant delete on table "public"."post_splits" to "authenticated";

grant insert on table "public"."post_splits" to "authenticated";

grant references on table "public"."post_splits" to "authenticated";

grant select on table "public"."post_splits" to "authenticated";

grant trigger on table "public"."post_splits" to "authenticated";

grant truncate on table "public"."post_splits" to "authenticated";

grant update on table "public"."post_splits" to "authenticated";

grant delete on table "public"."post_splits" to "service_role";

grant insert on table "public"."post_splits" to "service_role";

grant references on table "public"."post_splits" to "service_role";

grant select on table "public"."post_splits" to "service_role";

grant trigger on table "public"."post_splits" to "service_role";

grant truncate on table "public"."post_splits" to "service_role";

grant update on table "public"."post_splits" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

create policy "Admins can manage members, and users can leave"
on "public"."group_members"
as permissive
for update
to public
using (((get_user_role_in_group(group_id, auth.uid()) = 'admin'::group_role) OR (user_id = auth.uid())));


create policy "Authenticated users can be added to groups"
on "public"."group_members"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Disallow deleting group members"
on "public"."group_members"
as permissive
for delete
to public
using (false);


create policy "Users can view memberships of groups they belong to"
on "public"."group_members"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid())))));


create policy "Authenticated users can create groups"
on "public"."groups"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Users can view groups they are members of"
on "public"."groups"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid())))));


create policy "Active group members can create invites"
on "public"."invites"
as permissive
for insert
to public
with check (is_active_group_member(group_id, auth.uid()));


create policy "Group members and invitees can see invites"
on "public"."invites"
as permissive
for select
to public
using ((is_active_group_member(group_id, auth.uid()) OR (invitee_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


create policy "Invitees can accept or decline their own invites"
on "public"."invites"
as permissive
for update
to public
using ((invitee_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));


create policy "Invitees can delete their own invites"
on "public"."invites"
as permissive
for delete
to public
using ((invitee_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));


create policy "Users can manage their own notifications"
on "public"."notifications"
as permissive
for all
to public
using ((user_id = auth.uid()));


create policy "Active group members can view post history"
on "public"."post_history"
as permissive
for select
to public
using (is_active_group_member(( SELECT posts.group_id
   FROM posts
  WHERE (posts.id = post_history.post_id)), auth.uid()));


create policy "Active group members can manage post splits"
on "public"."post_splits"
as permissive
for all
to public
using (is_active_group_member(( SELECT posts.group_id
   FROM posts
  WHERE (posts.id = post_splits.post_id)), auth.uid()));


create policy "Active group members can manage posts"
on "public"."posts"
as permissive
for all
to public
using (is_active_group_member(group_id, auth.uid()));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


CREATE TRIGGER on_post_edited AFTER INSERT ON public.post_history FOR EACH ROW EXECUTE FUNCTION handle_edited_post_notification();

CREATE TRIGGER on_new_expense AFTER INSERT ON public.posts FOR EACH ROW WHEN ((new.type = 'expense'::post_type)) EXECUTE FUNCTION handle_new_expense_notification();

CREATE TRIGGER on_settlement_request AFTER INSERT ON public.posts FOR EACH ROW WHEN (((new.type = 'settlement'::post_type) AND (new.status = 'pending_confirmation'::post_status))) EXECUTE FUNCTION handle_settlement_request_notification();



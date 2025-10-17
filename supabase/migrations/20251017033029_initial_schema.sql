create type "public"."group_role" as enum ('admin', 'member');

create type "public"."invite_status" as enum ('pending', 'accepted', 'declined');

create type "public"."member_status" as enum ('active', 'inactive');

create type "public"."notification_type" as enum ('new_expense', 'expense_edited', 'settlement_request', 'settlement_confirmed', 'group_invite');

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
    "group_id" uuid,
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
    "description" text,
    "date" date default CURRENT_DATE,
    "total_amount" numeric(10,2),
    "payer_id" uuid,
    "image_url" text,
    "status" post_status not null default 'active'::post_status,
    "metadata" jsonb,
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

alter table "public"."notifications" add constraint "notifications_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_group_id_fkey";

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

create policy "Allow all actions for authenticated users"
on "public"."group_members"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."groups"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."invites"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."notifications"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."post_history"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."post_splits"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."posts"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow all actions for authenticated users"
on "public"."profiles"
as permissive
for all
to authenticated
using (true)
with check (true);




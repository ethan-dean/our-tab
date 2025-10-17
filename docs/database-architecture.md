# Database Architecture

This document outlines the schema for the application's PostgreSQL database, managed by Supabase.

## Table of Contents
- [ENUM Types](#enum-types)
- [Tables](#tables)
  - [groups](#groups-table)
  - [group_members](#group_members-table)
  - [profiles](#profiles-table)
  - [invites](#invites-table)
  - [posts](#posts-table)
  - [post_splits](#post_splits-table)
  - [post_history](#post_history-table)
  - [notifications](#notifications-table)

---

## ENUM Types

These are the custom data types used throughout the database.

*   **`group_role`**: `'admin'`, `'member'`
*   **`invite_status`**: `'pending'`, `'accepted'`, `'declined'`
*   **`member_status`**: `'active'`, `'inactive'`
*   **`notification_type`**: `'new_expense'`, `'expense_edited'`, `'settlement_request'`, `'settlement_confirmed'`, `'group_invite'`
*   **`post_status`**: `'active'`, `'pending_amount'`, `'pending_confirmation'`, `'invalid'`
*   **`post_type`**: `'expense'`, `'settlement'`, `'simplification_event'`

---

## Tables

### `groups` Table

Stores the basic information for each group.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key.** Defaults to `gen_random_uuid()`. |
| `name` | `text` | The display name of the group. Not null. |
| `created_by` | `uuid` | **Foreign Key** to `auth.users.id`. Tracks the original founder. |
| `created_at` | `timestamptz` | Automatically set on creation. |

### `group_members` Table

A junction table linking users to groups, defining their role and status.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `group_id` | `uuid` | **Composite Primary Key.** **Foreign Key** to `groups.id`. |
| `user_id` | `uuid` | **Composite Primary Key.** **Foreign Key** to `profiles.id`. |
| `role` | `group_role` | Not null, defaults to `'member'`. |
| `status` | `member_status` | Not null, defaults to `'active'`. |
| `joined_at` | `timestamptz` | Automatically set on insertion. |
| `left_at` | `timestamptz` | Nullable. Set when a user becomes `'inactive'`. |

### `profiles` Table

Stores public-facing user data, linked one-to-one with `auth.users`.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key.** **Foreign Key** to `auth.users.id`. |
| `first_name` | `text` | User's first name. |
| `last_name` | `text` | User's last name. |
| `payment_info` | `jsonb` | Optional user-provided payment details (e.g., Venmo, Zelle). |
| `updated_at` | `timestamptz` | Automatically updated timestamp. |
| `created_at` | `timestamptz` | Automatically set on creation. |

### `invites` Table

Manages pending invitations for users to join groups.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key.** Defaults to `gen_random_uuid()`. |
| `group_id` | `uuid` | **Foreign Key** to `groups.id`. |
| `inviter_id` | `uuid` | **Foreign Key** to `profiles.id`. The user who sent the invite. |
| `invitee_email`| `text` | The email address of the person being invited. Not null. |
| `status` | `invite_status`| Not null, defaults to `'pending'`. |
| `created_at` | `timestamptz` | Automatically set on creation. |

### `posts` Table

A central table for all feed items (expenses, settlements, etc.).

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key.** Defaults to `gen_random_uuid()`. |
| `group_id` | `uuid` | **Foreign Key** to `groups.id`. |
| `author_id` | `uuid` | **Foreign Key** to `profiles.id`. User who created the post. |
| `type` | `post_type` | Not null. E.g., `'expense'`, `'settlement'`. |
| `title` | `text` | The name of the expense or settlement. |
| `description` | `text` | Nullable. An optional, longer description for the post. |
| `date` | `date` | The date of the expense. Defaults to the current date. |
| `total_amount` | `numeric(10, 2)` | Nullable. If `NULL`, the post is "Pending". |
| `payer_id` | `uuid` | **Foreign Key** to `profiles.id`. Who paid for the expense. |
| `image_url` | `text` | Nullable. A URL to an image in Supabase Storage. |
| `status` | `post_status` | Not null, defaults to `'active'`. |
| `metadata` | `jsonb` | Nullable. Used to store extra data, like for debt simplification events. |
| `created_at` | `timestamptz` | Automatically set on creation. |

### `post_splits` Table

Details the specific financial obligation of each user for a given post.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key.** Defaults to `gen_random_uuid()`. |
| `post_id` | `uuid` | **Foreign Key** to `posts.id`. |
| `ower_id` | `uuid` | **Foreign Key** to `profiles.id`. The user who owes this portion. |
| `amount` | `numeric(10, 2)` | The specific amount this user owes. Not null. |

### `post_history` Table

Provides a complete, unchangeable audit log for every post.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key.** Auto-incrementing. |
| `post_id` | `uuid` | **Foreign Key** to `posts.id`. |
| `editor_id` | `uuid` | **Foreign Key** to `profiles.id`. The user who made the change. |
| `changes` | `jsonb` | A snapshot of the changes made. Not null. |
| `created_at`| `timestamptz`| Automatically set on creation. |

### `notifications` Table

Stores all notification records for users.

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key.** Auto-incrementing. |
| `user_id` | `uuid` | **Foreign Key** to `profiles.id`. The recipient of the notification. |
| `triggering_user_id`| `uuid` | **Foreign Key** to `profiles.id`. The user who caused the notification. |
| `post_id` | `uuid` | **Foreign Key** to `posts.id`. The related post. |
| `group_id` | `uuid` | **Foreign Key** to `groups.id`. The related group. *(Note: Assumed from migration logic)*. |
| `type` | `notification_type` | Not null. E.g., `'new_expense'`, `'group_invite'`. |
| `is_read` | `boolean` | Not null, defaults to `false`. |
| `created_at` | `timestamptz` | Automatically set on creation. |

---

## Row Level Security (RLS) Setup

This section describes the simplified Row Level Security (RLS) policy for the Minimum Viable Product (MVP) and internal testing phase. The goal is to secure the database by ensuring that only authenticated users can interact with the data, without enforcing fine-grained, per-row permissions.

### MVP Security Policy

For the current development phase, all tables in the `public` schema are protected by a single, simple RLS policy. This policy allows any user who has successfully authenticated (i.e., has a valid JWT) to perform `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations on any row in any table.

**Policy Rule:** The user's role must be `authenticated`.

`auth.role() = 'authenticated'`

This is a temporary measure to accelerate frontend development. These open policies will be replaced with stricter, context-aware rules before any production release.

### Implementation Example

To apply this policy to a table, you first need to enable Row Level Security on it, and then create the policy. The following is an example for the `groups` table. This process should be repeated for all public tables.

**1. Enable RLS on the table:**

```sql
-- Enable Row Level Security for the 'groups' table
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
```

**2. Create the policy:**

This single policy applies to `ALL` commands (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

```sql
-- Create a policy that allows any authenticated user to perform any action
CREATE POLICY "Allow all actions for authenticated users"
ON public.groups
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```
*Note: In Supabase, creating a policy `TO authenticated` with `USING (true)` and `WITH CHECK (true)` is a common way to enforce that a user must be logged in. An anonymous user would not have the `authenticated` role and would be denied access.*

### Applying to All Tables

The same `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and `CREATE POLICY ...` commands should be run for each of the following tables to ensure the entire database is protected by this baseline authentication check:

*   `groups`
*   `group_members`
*   `profiles`
*   `invites`
*   `posts`
*   `post_splits`
*   `post_history`
*   `notifications`

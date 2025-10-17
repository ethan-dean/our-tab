# Expense & Post Management Technical Specification (`expense-posts-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

---

## 1.0 Overview

This document specifies the technical design for creating, managing, and displaying all posts within a group, which includes both expenses and settlements. The architectural approach is centered on a normalized data model within Supabase to ensure data integrity, support complex debt-splitting logic, and maintain a complete audit trail.

The core of this design consists of three interconnected tables:
1.  **`posts`**: A central table for all feed items, defining the type, author, and high-level details.
2.  **`post_splits`**: A related table detailing the specific financial obligation of each user for a given post.
3.  **`post_history`**: An audit table that logs every creation and modification event for full transparency.

All create and update operations will be handled by **Supabase Database Functions (RPCs)** to guarantee transactional integrity. 🧾

---

## 2.0 Data Model

### 2.1 `posts` Table

This table serves as the primary record for any expense or settlement post.

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`id`** | `UUID` | **Primary Key.** |
| **`group_id`** | `UUID` | **Foreign Key** to `groups.id`. |
| **`author_id`** | `UUID` | **Foreign Key** to `profiles.id`. User who created the post. |
| **`type`** | `post_type` | **ENUM Type** with values: `'expense'`, `'settlement'`. |
| **`title`** | `TEXT` | The name of the expense or settlement. |
| **`description`** | `TEXT` | Nullable. A longer description for the post. |
| **`date`** | `DATE` | The date of the expense. Defaults to current date. |
| **`total_amount`** | `NUMERIC(10, 2)` | Nullable. If `NULL`, the post is "Pending" (FR 3.3.4). |
| **`payer_id`** | `UUID` | **Foreign Key** to `profiles.id`. Who paid for the expense or sent the settlement. |
| **`image_url`** | `TEXT` | Nullable. A URL pointing to an image in Supabase Storage. |
| **`status`** | `post_status` | **ENUM Type** with values: `'active'`, `'pending_amount'`, `'pending_confirmation'`, `'invalid'`. |
| **`metadata`** | `JSONB` | Nullable. Used for extra data like in debt simplification. |
| **`created_at`** | `TIMESTAMPTZ` | Automatically set on creation. |

### 2.2 `post_splits` Table

This table is the heart of the debt calculation, breaking down who owes what for each post.

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`id`** | `UUID` | **Primary Key.** |
| **`post_id`** | `UUID` | **Foreign Key** to `posts.id`. |
| **`ower_id`** | `UUID` | **Foreign Key** to `profiles.id`. The user who owes this portion. |
| **`amount`** | `NUMERIC(10, 2)` | The specific amount this user owes for this split. |

### 2.3 `post_history` Table

This table provides a complete, unchangeable audit log for every post (FR 3.3.6).

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`id`** | `BIGSERIAL` | **Primary Key.** |
| **`post_id`** | `UUID` | **Foreign Key** to `posts.id`. |
| **`editor_id`** | `UUID` | **Foreign Key** to `profiles.id`. The user who made the change. |
| **`changes`** | `JSONB` | A snapshot of the changes. *Example: `{ "action": "create", "state": { ...full post data... } }` or `{ "action": "edit", "diff": { "title": { "before": "Old", "after": "New" } } }`*. |
| **`created_at`**| `TIMESTAMPTZ`| Automatically set on creation. |

---

## 3.0 Core Operations & Flows

### 3.1 Post Creation & Editing (FR 3.3.3, 3.3.5, 3.4)

Due to the need to write to multiple tables simultaneously (`posts`, `post_splits`, `post_history`), these operations **must** be encapsulated in **Supabase Database Functions (RPCs)** to ensure atomicity.

* **Mechanism:** Two RPCs: `create_post` and `edit_post`.
* **Flow:**
    1.  The React client calculates the debt distribution based on the user-selected split logic (equal, exact, or hybrid) (FR 3.4).
    2.  The client constructs a JSON payload containing all post details (including the new `description` and `date` fields) and an array of `split` objects (each with a `user_id` and `amount`).
    3.  The client calls the appropriate RPC function with this payload.
    4.  The RPC function executes a single transaction to:
        a.  Insert or update the row in the `posts` table.
        b.  Delete existing and/or insert new rows into the `post_splits` table.
        c.  Insert a new audit row into the `post_history` table.

### 3.2 Image Uploads (FR 3.3.3)

* **Mechanism:** The application will use **Supabase Storage**.
* **Flow:**
    1.  The client uploads the image file directly to a designated, secured Supabase Storage bucket.
    2.  Upon a successful upload, Supabase Storage provides a URL for the file.
    3.  The client includes this URL in the `image_url` field of the payload sent to the `create_post` or `edit_post` RPC.

---

## 4.0 Key Feature Implementation

### 4.1 Dashboard Balance Summary (FR 3.3.2)

Calculating the net balance for every user in real-time is inefficient. This will be optimized at the database level.

* **Mechanism:** A **PostgreSQL View** named `group_balances` will be created.
* **Logic:** This view will pre-calculate the net financial position for each user within each group. For every user, it will:
    1.  Sum the `total_amount` from `posts` where they are the `payer_id` (money they are owed).
    2.  Sum the `amount` from `post_splits` where they are the `ower_id` (money they owe).
    3.  Provide a single `net_balance` column (`paid - owed`).
* **Benefit:** The React client can perform a simple and fast query against this view to display the dashboard summary, offloading the complex aggregation to the database. 📈

### 4.2 Post Feed & Filtering (FR 3.3.1, 3.6.2)

* **Mechanism:** The client will fetch data from the `posts` table, joined with `profiles` to get author/payer names.
* **Filtering Logic:** Supabase's PostgREST API supports rich filtering. The client will dynamically construct API queries to filter by:
    * **Title:** `...ilike('%searchText%')`
    * **Payer:** `...eq('payer_id', 'uuid-of-payer')`
    * **Members Involved:** This will use the `.rpc()` method to call a custom database function that takes a `user_id` and returns all `post_ids` they are involved in (as either a payer or an ower).

---

## 5.0 Authorization (Supabase RLS)

*   **MVP Security Policy:** For the initial MVP and internal testing, RLS policies on post-related tables will be relaxed. Instead of checking for group membership, the policies for `SELECT`, `INSERT`, and `UPDATE` operations will simply verify that the user is authenticated.
*   **Implementation:** The RLS policy will be a simple check for `auth.role() = 'authenticated'`. This allows any logged-in user to create, read, and edit any post, which is suitable for the current development phase. This approach will be replaced with stricter, group-based permissions before production.

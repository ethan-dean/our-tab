# Group Management Technical Specification (`groups-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

---

## 1.0 Overview

This document outlines the technical design for the group management functionality. The system will allow users to create groups, manage memberships, and handle roles and permissions. The core of this system will be a relational model in Supabase, centered around a `groups` table and a `group_members` junction table.

Complex, transactional operations like group creation or an admin leaving a group will be encapsulated in **Supabase Database Functions (RPCs)**. This ensures that multi-step actions are performed atomically, maintaining data integrity and simplifying client-side logic. 🤝

---

## 2.0 Data Model

To manage the many-to-many relationship between users and groups, and to store membership metadata, two primary tables will be created.

### 2.1 `groups` Table

This table stores the basic information for each group.

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`id`** | `UUID` | **Primary Key.** |
| **`name`** | `TEXT` | The display name of the group. |
| **`created_by`** | `UUID` | **Foreign Key** to `auth.users.id`. Tracks the original founder. |
| **`created_at`**| `TIMESTAMPTZ`| Automatically set on creation. |

### 2.2 `group_members` Table

This is a **junction table** that links users to groups and defines their role and status within that group. It is the cornerstone of our group management logic.

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`group_id`** | `UUID` | **Composite Primary Key**, **Foreign Key** to `groups.id`. |
| **`user_id`** | `UUID` | **Composite Primary Key**, **Foreign Key** to `profiles.id`. |
| **`role`** | `group_role` | **ENUM Type** with values: `'admin'`, `'member'`. |
| **`status`** | `member_status`| **ENUM Type** with values: `'active'`, `'inactive'`. Implements the "Frozen" state. |
| **`joined_at`** | `TIMESTAMPTZ`| Automatically set on insertion. |
| **`left_at`** | `TIMESTAMPTZ`| Nullable. Set when a user's status becomes `'inactive'`. |



### 2.3 `invites` Table

This table will manage pending invitations to join a group.

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`id`** | `UUID` | **Primary Key**. |
| **`group_id`** | `UUID` | **Foreign Key** to `groups.id`. |
| **`inviter_id`**| `UUID` | **Foreign Key** to `profiles.id`. The user who sent the invite. |
| **`invitee_email`**| `TEXT` | The email address of the person being invited. |
| **`status`** | `invite_status`| **ENUM Type** with values: `'pending'`, `'accepted'`, `'declined'`. |
| **`created_at`**| `TIMESTAMPTZ`| Automatically set on creation. |

---

## 3.0 Core Group Operations & Flows

### 3.1 Group Creation (FR 3.2.1)

Creating a group requires two inserts (`groups` and `group_members`) that must succeed or fail together.
* **Mechanism:** This will be implemented as a single **Supabase Database Function (RPC)** named `create_group`.
* **Flow:**
    1.  The client calls the `create_group` function, passing the desired `group_name` and the creator's `user_id` (from their auth token).
    2.  The function starts a transaction.
    3.  It inserts a new row into the `groups` table.
    4.  It inserts a new row into the `group_members` table, linking the new group to the creator, assigning them the `'admin'` role and `'active'` status.
    5.  The transaction is committed.

### 3.2 Leaving a Group & Member Removal (FR 3.2.3, 3.2.4, 3.2.6)

To preserve transaction history, members are never deleted from a group. Instead, their status is changed.
* **Mechanism:** This is an `UPDATE` operation on the `group_members` table.
* **Flow:** When a user leaves or is removed, their `status` in the `group_members` table is updated from `'active'` to `'inactive'`, and the `left_at` field is populated.
* **"Frozen" State:** This `'inactive'` status is the technical implementation of the "frozen" member state. Other parts of the application (like creating a new expense) will filter for members `WHERE status = 'active'`, automatically excluding inactive members from new activities.

### 3.3 Admin Transfer on Departure (FR 3.2.5)

This critical workflow ensures a group is never left without an admin.
* **Mechanism:** A **Supabase Database Function (RPC)** named `transfer_admin_and_leave`.
* **Flow:**
    1.  The React frontend will enforce the selection of a new admin before allowing the current admin to initiate the leave action.
    2.  The client calls the RPC with `group_id`, `new_admin_id`, and the current admin's `user_id`.
    3.  The function executes a transaction to:
        a.  Update the `role` of the `new_admin_id` to `'admin'`.
        b.  Update the `status` of the current admin to `'inactive'`.

### 3.4 Member Invitations (FR 3.2.2)

This flow outlines how a user joins a group via an invitation.

*   **Mechanism:** An existing group member creates an invitation, which generates a unique URL containing the `group_id`. This URL can be shared via email, text, or other methods.
*   **Flow:**
    1.  The invited person clicks the invitation link and is directed to a specific page within the web app.
    2.  The application checks if the user has a valid session (is logged in).
    3.  **If Logged In:** The user is presented with "Accept" or "Decline" options for the invitation. The client calls the `accept_invite` or `decline_invite` RPC.
    4.  **If Not Logged In:** The user is shown the group name and prompted to either **Log In** or **Register**. After successfully logging in or creating an account, they are automatically added to the group as if they had clicked "Accept".
*   **Pending Invites:** For a logged-in user, any pending invitations sent to their email address will be displayed on their main notifications page.

---

## 4.0 Technical Implementation Details

### 4.1 Frontend (TypeScript-React)

* **Data Fetching:** The client will fetch a user's groups by querying the `group_members` table for their `user_id`, then joining with the `groups` table to get group names.
*   **UI Logic for "Previous Groups/Members" (FR 3.2.7):** The client will fetch all associated groups/members and then filter them into two lists for display based on the `status` field (`'active'` vs. `'inactive'`). Members with an `'inactive'` status will appear in the "Previous Members" tab.

### 4.2 Backend (Supabase RPCs)

The use of database functions is central to this design. It moves transactional logic to the database layer, ensuring atomicity and providing a simple, secure API for the client to call. Key RPCs will include `create_group`, `accept_invite`, and `transfer_admin_and_leave`.

---

## 5.0 Authorization (Supabase RLS)

Row Level Security (RLS) policies are essential to ensure users can only see and modify data they are permitted to access.

* **On `groups` table:**
    * **`SELECT`:** Users can only see groups they are a member of. The policy will check for the existence of a corresponding row in `group_members` where `user_id = auth.uid()`.

* **On `group_members` table:**
    * **`SELECT`:** Users can only see membership records for groups they belong to.
    * **`UPDATE`:** A user's ability to update a record depends on their role. The RLS policy will be more complex:
        * A user can update their **own** record if they are changing their status to `'inactive'` (leaving the group).
        * A user with the `'admin'` role can update **any** record within that group (e.g., to remove another member or promote them).

* **On `expenses` table (related):**
    * **`INSERT` / `UPDATE`:** Any action on expenses will first check if the requesting user is an `'active'` member of that group via a join to the `group_members` table. This policy enforces the "frozen" state at the database level. 🔒

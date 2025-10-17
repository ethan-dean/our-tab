# Profile Management Technical Specification (`profiles-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

---

## 1.0 Overview

This document details the technical design for user profile management. This system is distinct from authentication; while authentication verifies *who* a user is, profile management deals with the user's application-specific data.

Our approach is to create a dedicated **`profiles` table** within our Supabase database. This table will be linked via a one-to-one relationship with Supabase's built-in `auth.users` table. This separation is a best practice that keeps secure authentication data isolated from general application data, providing a more secure and flexible data model. 🧑‍💻

---

## 2.0 Data Model

A new table named `profiles` will be created in the `public` schema of the Supabase database. This table will store information that users can view and edit on their profile page.

### 2.1 `profiles` Table Schema

| Column | Type | Constraints & Notes |
| :--- | :--- | :--- |
| **`id`** | `UUID` | **Primary Key.** A foreign key that references `auth.users.id`. Enforces a one-to-one relationship. |
| **`first_name`** | `TEXT` | User's first name. Can be edited. |
| **`last_name`** | `TEXT` | User's last name. Can be edited. |
| **`payment_info`**| `JSONB` | Stores optional, user-provided payment details. Nullable. *Example: `{ "venmo": "@jane-doe", "zelle": "555-123-4567" }`*. |
| **`updated_at`** | `TIMESTAMPTZ`| Automatically updated timestamp. |
| **`created_at`** | `TIMESTAMPTZ`| Automatically set on creation. |

### 2.2 Automated Profile Lifecycle Management

To ensure data integrity and preserve historical records, a user's profile is automatically created and managed via database triggers.

*   **Profile Creation:** A trigger will fire whenever a new user is inserted into the `auth.users` table. It will execute a function that creates a corresponding row in our `public.profiles` table, populating the `id`, `first_name`, and `last_name` from the new user's authentication data.
*   **Profile Anonymization on Deletion:** To maintain referential integrity, user profiles are never truly deleted. A trigger will fire `AFTER DELETE` on the `auth.users` table. This trigger will:
    1.  Find the corresponding row in the `public.profiles` table.
    2.  Update the row to anonymize the user's data:
        *   Set `first_name` to `'Former'`.
        *   Set `last_name` to `'User'`.
        *   Set `payment_info` to `NULL`.
    3.  This preserves the `id` for foreign key relationships in old posts and comments, preventing broken links in the UI, while removing personal information.



---

## 3.0 Core Profile Operations (FR 3.1.4)

All profile operations will be initiated from the client-side React application and will interact directly with the Supabase API, secured by Row Level Security policies.

### 3.1 Fetching Profile Data

* **Flow:** When a logged-in user navigates to their profile page, the React client will fetch their data.
* **API Call:** The client will use `supabase.from('profiles').select('*').eq('id', user.id).single()`. The `user.id` is retrieved from the active session object provided by the `AuthContext`.

### 3.2 Updating Profile Data

The user profile page will contain a form allowing the user to modify their information.

* **Updating Name:**
    1.  The client will call `supabase.from('profiles').update({ first_name, last_name }).eq('id', user.id)` to update the public profile information.
    2.  Simultaneously, the client will call `supabase.auth.updateUser({ data: { first_name, last_name } })` to keep the metadata in the `auth.users` table synchronized for consistency.
* **Updating Payment Information:**
    * The client will send an update request with the new `payment_info` JSON object.
    * **API Call:** `supabase.from('profiles').update({ payment_info: newPaymentDetails }).eq('id', user.id)`.
* **Updating Password:**
    * This is fundamentally an **authentication** action, not a profile data action, even though the UI is on the profile page.
    * **API Call:** The client will call `supabase.auth.updateUser({ password: newPassword })`. This interacts only with the Supabase Auth service and does not touch the `profiles` table.

---

## 4.0 Technical Implementation Details

### 4.1 Frontend (TypeScript-React)

* **Profile Page Component:** A dedicated route and component (e.g., `/profile`) will be created to display and edit profile information.
* **State Management:** Component-level state (`useState`) or a form library (e.g., `react-hook-form`) will be used to manage the form fields for editing the user's profile.
* **Data Fetching:** The component will use the authenticated user's ID from the global `AuthContext` to fetch and update the correct profile record.

### 4.2 Authorization & Security (Supabase RLS)

**Row Level Security (RLS)** for the `profiles` table will be relaxed for the MVP to align with the project's temporary internal testing policy.

* **`SELECT` Policy:** A policy will be created that allows any authenticated user to read any profile.
    * **RLS Expression:** `auth.role() = 'authenticated'`
* **`UPDATE` Policy:** A policy will be created that allows any authenticated user to update any profile.
    * **RLS Expression:** `auth.role() = 'authenticated'`

This open policy allows any logged-in user to view and modify any other user's profile information. This is a significant security simplification for the MVP and will be replaced with strict policies that ensure users can only access and modify their own profile before any production release. 🛡️

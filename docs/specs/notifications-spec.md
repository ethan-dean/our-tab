# In-App Notification System Specification (`notifications-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

---

## 1.0 Overview & Architecture

This document specifies the technical design for the in-app notification system. The system will alert users to key events within their groups, such as new expenses and settlement requests. The architecture is designed to be highly reliable and robust by being **backend-driven**.

The core mechanism for creating notifications will be **PostgreSQL Triggers** within the Supabase database. This server-side approach ensures that notifications are generated transactionally and reliably whenever a qualifying event occurs in the database, independent of the client application. 🔔

---

## 2.0 Data Model

To support this system, a single new table, `notifications`, will be created in the database.

### 2.1 `notifications` Table Schema

This table will store a record for every notification generated for a user.

| Column                | Type                | Constraints & Notes                                                                                             |
| :-------------------- | :------------------ | :-------------------------------------------------------------------------------------------------------------- |
| **`id`** | `BIGSERIAL`         | **Primary Key.** |
| **`user_id`** | `UUID`              | **Foreign Key** to `profiles.id`. This is the user who *receives* the notification.                             |
| **`triggering_user_id`**| `UUID`              | **Foreign Key** to `profiles.id`. This is the user whose action *caused* the notification.                    |
| **`post_id`** | `UUID`              | **Foreign Key** to `posts.id`. The specific post that this notification is about, allowing for direct navigation. |
| **`type`** | `notification_type` | **ENUM Type** with values: `'new_expense'`, `'expense_edited'`, `'settlement_request'`, `'settlement_confirmed'`.      |
| **`is_read`** | `BOOLEAN`           | Defaults to `false`. Tracks the read/unread status.                                                             |
| **`created_at`** | `TIMESTAMPTZ`       | Automatically set upon creation.                                                                                |

---

## 3.0 Notification Creation via Database Triggers (FR 3.7.2)

The logic for generating notifications will be encapsulated in database triggers that automatically fire when specific data changes occur in the `posts` table.

* **Trigger 1: New Expense Involvement**
    * **Event:** `AFTER INSERT` on the `posts` table where `type = 'expense'`.
    * **Action:** The trigger's function will read the associated records from `post_splits` and create a notification for each involved user (the "owers"), making sure not to notify the user who created the expense.
* **Trigger 2: Expense Edit**
    * **Event:** `AFTER UPDATE` on the `posts` table.
    * **Action:** The trigger's function will create a notification for all users involved in the expense (both the payer and the owers), excluding the user who performed the edit.
* **Trigger 3: Settlement Request Received**
    * **Event:** `AFTER INSERT` on the `posts` table where `type = 'settlement'` and `status = 'pending_confirmation'`.
    * **Action:** The function will create a single notification for the recipient of the settlement payment.
* **Trigger 4: Settlement Confirmed**
    * **Event:** `AFTER UPDATE` on the `posts` table when the `status` field changes from `'pending_confirmation'` to `'active'`.
    * **Action:** The function will create a single notification for the original sender of the settlement (the `payer_id`).

---

## 4.0 Notification Presentation & Management (UI)

The client-side React application will be responsible for fetching and displaying notifications.

* **Notification Indicator:** A component in the main application layout (e.g., a "bell icon") will periodically query the database to get the `count` of notifications for the current user where `is_read = false`. This will be used to display a badge indicating new notifications.
*   **Notifications Page:**
    *   A dedicated route and page (e.g., `/notifications`) will fetch and display a list of all notifications for the logged-in user, ordered from newest to oldest.
    *   **Pending Invitations:** At the top of this page, a separate section will display any pending group invitations for the user, allowing them to accept or decline.
    *   Each notification in the list will be a clickable link that navigates the user to the relevant post detail page (e.g., `/group/:groupId/post/:postId`).
* **Marking as Read:**
    * **Mechanism:** A **Supabase Database Function (RPC)**, such as `mark_notifications_as_read`, will be created.
    * **Flow:** When a user visits the `/notifications` page, a `useEffect` hook will call this RPC. The function will then update all of the user's unread notifications by setting `is_read` to `true`. This ensures the unread count is updated efficiently in a single, secure backend call.

---

## 5.0 Authorization (Supabase RLS)

For the MVP and internal testing, RLS policies on the `notifications` table will be simplified.

*   **Policy:** The policies for `SELECT`, `UPDATE`, and `DELETE` will only check that a user is authenticated (`auth.role() = 'authenticated'`).
*   **Implication:** This means any authenticated user can read, update (e.g., mark as read), or delete any notification in the system. This will be replaced with a strict policy where users can only access their own notifications before production.
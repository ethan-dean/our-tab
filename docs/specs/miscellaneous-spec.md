# General & Miscellaneous Functionality Specification (`miscellaneous-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

***

## 1.0 General Functionality

This section covers application-wide conventions and features that ensure a consistent and user-friendly experience.

---

### 1.1 Currency Handling (FR 3.6.1)

The application will operate with a single, fixed currency.

* **Database:** All monetary values will be stored in the database using the `NUMERIC(10, 2)` data type. This is crucial for avoiding floating-point precision errors that can occur with other data types.
* **Frontend:** The React application is responsible for all currency formatting. It will use the browser's built-in `Intl.NumberFormat` API to display numerical values as United States Dollars (e.g., `$1,234.56`). No currency conversion logic is required. 💵

---

### 1.2 Client-Side Routing & Detail Views (FR 3.6.3)

A seamless, single-page application (SPA) experience will be managed by a client-side routing library.

* **Technology:** **React Router** will be used to manage navigation within the application.
* **URL Structure:** The application will use a hierarchical URL structure to represent the application's state. For example:
    * `/group/:groupId`: Displays the main dashboard and post feed for a specific group.
    * `/group/:groupId/post/:postId`: Displays the dedicated detail view for a single expense or settlement post.
* **Implementation:** The `postId` from the URL parameter will be used by the React component to fetch the specific data for that post and its associated edit history.

---

### 1.3 Edit History Display (FR 3.6.4)

The post detail page will display a complete audit log of all changes made to a post.

* **Mechanism:** This is a data presentation feature. The client will fetch all associated records from the `post_history` table for a given `post_id`.
* **UI Implementation:** The React component will map over the history records and render a list item for each entry. Each item will display the editor's name (joined from the `profiles` table), the timestamp of the edit, and a human-readable summary generated from the `changes` JSONB object.

## 2.0 In-App Notification System

The application will feature a real-time, in-app notification system to keep users informed of relevant events.

---

### 2.1 Overview & Architecture

The notification system will be backend-driven to ensure reliability and transactional integrity.

* **Mechanism:** New notifications will be created automatically by **PostgreSQL Triggers** within the Supabase database. This server-side approach guarantees that a notification is generated whenever a qualifying event occurs, independent of the client application.

---

### 2.2 Data Model (`notifications` Table)

A dedicated table will be created to store all notification records.

| Column                | Type                | Constraints & Notes                                                                          |
| :-------------------- | :------------------ | :------------------------------------------------------------------------------------------- |
| **`id`** | `BIGSERIAL`         | **Primary Key.** |
| **`user_id`** | `UUID`              | **Foreign Key** to `profiles.id`. The user who receives the notification.                      |
| **`triggering_user_id`**| `UUID`              | **Foreign Key** to `profiles.id`. The user whose action caused the notification.             |
| **`post_id`** | `UUID`              | **Foreign Key** to `posts.id`. The post that this notification is about.                     |
| **`type`** | `notification_type` | **ENUM Type** with values: `'new_expense'`, `'expense_edited'`, `'settlement_request'`, `'settlement_confirmed'`. |
| **`is_read`** | `BOOLEAN`           | Defaults to `false`.                                                                         |
| **`created_at`** | `TIMESTAMPTZ`       | Automatically set on creation.                                                               |

---

### 2.3 Notification Creation via Database Triggers (FR 3.7.2)

A series of database triggers will be attached to the `posts` table to automate notification creation.

* **Trigger 1: New Expense Involvement**
    * **Event:** `AFTER INSERT` on `posts` where `type = 'expense'`.
    * **Action:** The trigger function will create a notification for each user in the expense's `post_splits` table (the "owers"), excluding the post's author.
* **Trigger 2: Expense Edit**
    * **Event:** `AFTER UPDATE` on `posts`.
    * **Action:** Creates a notification for all involved users (payers and owers), excluding the user who performed the edit.
* **Trigger 3: Settlement Request Received**
    * **Event:** `AFTER INSERT` on `posts` where `status = 'pending_confirmation'`.
    * **Action:** Creates a single notification for the recipient of the settlement.
* **Trigger 4: Settlement Confirmed**
    * **Event:** `AFTER UPDATE` on `posts` when `status` changes from `'pending_confirmation'` to `'active'`.
    * **Action:** Creates a single notification for the original sender of the settlement.

---

### 2.4 Notification Presentation (UI)

* **Mechanism:** The main UI shell will include a notification bell icon component. This component will periodically fetch the `count` of notifications where `is_read = false` for the current user.
* **Flow:** Clicking the bell will navigate the user to a dedicated `/notifications` page, which lists all notifications. When this page is loaded, it will call a Supabase RPC function (e.g., `mark_notifications_as_read`) to update the `is_read` flag for the displayed items in the database. 🔔

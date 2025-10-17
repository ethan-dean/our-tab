# Debt Splitting Management Technical Specification (`debt-splitting-spec.md`)

  * **Version:** 1.0
  * **Date:** October 13, 2025
  * **Author:** Gemini

-----

## 1.0 Overview

This document specifies the technical design for the debt-splitting logic when creating or editing an expense. This system is responsible for calculating the individual amounts owed by members for a given post.

The core architectural decision is that all splitting calculations will be performed **entirely on the client-side** within the React application. This approach provides a highly responsive and interactive user experience, where financial distributions are updated in real-time as a user inputs data. The backend's role is solely to persist the final, pre-calculated results sent by the client. This spec does not introduce new database tables but defines the computational logic that generates the data for the `post_splits` table. divide;

-----

## 2.0 Client-Side State Management (React)

The expense creation/editing component in the React application will manage the form's state to facilitate real-time calculations.

  * **Core State Variables:**
      * `totalAmount: number`: The total cost of the expense.
      * `involvedMembers: MemberSplit[]`: An array of objects, where each object represents a person involved in the split. The structure will be:
        ```typescript
        interface MemberSplit {
          userId: string;
          name: string;
          // The value from the input field, stored as a string for controlled components
          inputValue: string;
          // The final calculated amount owed by this user
          calculatedAmount: number;
          // A boolean to track if the user has entered a specific, "exact" amount
          isAmountLocked: boolean;
        }
        ```
  * **Reactive Logic:** A `useEffect` hook in React will be responsible for re-running the splitting algorithm whenever `totalAmount` or any property within the `involvedMembers` array changes. This ensures the UI always reflects the correct financial breakdown.

-----

## 3.0 Calculation Logic Flows (FR 3.4)

The client-side component will implement a single, robust algorithm to handle all splitting scenarios.

### 3.1 Hybrid Split Algorithm (FR 3.4.3)

This is the primary algorithm that also covers the simpler "equal only" and "exact only" cases.

  * **Trigger:** This logic runs within the `useEffect` hook mentioned above.
  * **Steps:**
    1.  **Initialization:**
          * Initialize a `remainingAmount` variable to the `totalAmount`.
          * Initialize an `unlockedMemberCount` variable to zero.
    2.  **First Pass (Process Exact Amounts):**
          * Iterate through the `involvedMembers` array.
          * For each member where `isAmountLocked` is `true`, parse their `inputValue` to a number.
          * Subtract this number from `remainingAmount`.
    3.  **Second Pass (Count Remaining Members):**
          * Iterate through the `involvedMembers` array again.
          * For each member where `isAmountLocked` is `false`, increment `unlockedMemberCount`.
    4.  **Calculate Equal Share:**
          * If `unlockedMemberCount > 0`, calculate the `equalShare` by dividing `remainingAmount` by `unlockedMemberCount`. Ensure this handles division by zero.
    5.  **Final Pass (Assign Calculated Amounts):**
          * Iterate through the `involvedMembers` array a final time.
          * For a "locked" member, their `calculatedAmount` is their parsed `inputValue`.
          * For an "unlocked" member, their `calculatedAmount` is the `equalShare`.

### 3.2 Input Validation (FR 3.4.4)

Validation will occur in real-time on the client side to provide immediate feedback.

  * **Primary Check:** The sum of all user-entered "locked" amounts cannot exceed the expense's `totalAmount`.
  * **Implementation:** During the "First Pass" of the algorithm, if `remainingAmount` drops below zero, an error state will be triggered in the component.
  * **UI Feedback:** When an error state is active, the form's submit button will be disabled, and a clear error message (e.g., "Sum of exact amounts is greater than the total cost") will be displayed to the user.

-----

## 4.0 Data Payload for Backend

Once the user is satisfied with the split and submits the form, the client will format a clean JSON object to send to the backend Supabase RPC (`create_post` or `edit_post`).

  * **Payload Structure:** The client will construct an object that includes the post's metadata and a simplified `splits` array derived from the component's state.

    ```json
    {
      "group_id": "...",
      "title": "Groceries",
      "description": "Weekly grocery run",
      "date": "2025-10-26",
      "total_amount": 125.50,
      "payer_id": "...",
      "splits": [
        { "ower_id": "user-uuid-1", "amount": 62.75 },
        { "ower_id": "user-uuid-2", "amount": 62.75 }
      ]
    }
    ```

  * **Backend Responsibility:** The backend RPC will be intentionally simple. It will **not** perform any splitting calculations. Its sole responsibility is to receive this payload, validate permissions, and write the data to the `posts` and `post_splits` tables exactly as provided. This creates a clear separation of concerns between the client and server. ✅

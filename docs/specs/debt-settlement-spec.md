# Debt Settlement Management Technical Specification (`debt-settlement-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

---

## 1.0 Overview

This document outlines the technical design for tracking debt settlements and performing group-wide debt simplification. The architecture is designed for data consistency and security, leveraging the existing `posts` table and Supabase Database Functions (RPCs) for complex logic.

* **Settlements as Posts:** A payment between two users will be recorded as a `post` with the `type` of `'settlement'`. This unifies all financial activities into a single feed and data structure.
* **Stateful Confirmation:** A confirmation workflow for user-created settlements will be managed using a `status` field on the `posts` table.
* **Backend Simplification:** The complex task of calculating simplified debt paths will be handled entirely by a **Supabase Database Function (RPC)**, ensuring the logic is centralized, secure, and performant. 💸

---

## 2.0 Data Model Integration

Settlements will not require a new table. Instead, they will be a specific type of record within the existing `posts` and `post_splits` tables.

* **Representation of a Settlement:** Consider a payment of $20 from User A (Sender) to User B (Recipient).
    * In the **`posts` table**, a new row is created where:
        * `type` = `'settlement'`
        * `payer_id` = User A's ID (The sender is treated as the "payer").
        * `total_amount` = `20.00`
    * In the **`post_splits` table**, a single corresponding row is created where:
        * `ower_id` = User B's ID (The recipient is the "ower" of this credit).
        * `amount` = `20.00`
* **Impact on Balances:** This model integrates perfectly with the `group_balances` view. The sender's total amount paid increases, and the recipient's total amount owed effectively decreases, thus settling the debt between them.

---

## 3.0 Settlement Confirmation Workflow (FR 3.5.3)

This workflow ensures that payments logged by a sender are verified by the recipient.

* **Mechanism:** The workflow is managed by changing the `status` field in the `posts` table (`'pending_confirmation'`, `'active'`, `'invalid'`). All state changes are handled by a secure Supabase RPC.
* **Flow - Sender Creates Post:**
    1.  The sender initiates a settlement post in the UI.
    2.  The client calls an RPC, `create_settlement`, with the sender, recipient, and amount.
    3.  The RPC creates the `post` and `post_split` records and sets the post's `status` to **`'pending_confirmation'`**. The balances in the `group_balances` view will update immediately to reflect this pending transaction.
* **Flow - Recipient Confirms/Denies:**
    1.  The recipient is notified and prompted in the UI to act on the pending settlement.
    2.  The client calls an RPC, `resolve_settlement(post_id, action)`, where `action` is either `'confirm'` or `'deny'`.
    3.  The RPC will verify that the calling user is authenticated. For the MVP, it will not check if the user is the designated recipient, allowing any authenticated user to resolve the settlement.
    4.  If the action is `'confirm'`, the RPC updates the post `status` to **`'active'`**. The transaction is now final.
    5.  If the action is `'deny'`, the RPC updates the post `status` to **`'invalid'`**. This serves as a "soft delete," preserving the record of the denied payment while ensuring it is excluded from all future balance calculations. This correctly reverts the transaction.

*Note: If the recipient creates the settlement post, it is self-attested and can be created with the status `'active'` immediately.*

---

## 4.0 Debt Simplification (FR 3.5.4)

This feature calculates the most efficient payment paths to clear all debts within a group. This is a computationally intensive task handled by the backend.

* **Mechanism:** A **Supabase Database Function (RPC)** named `simplify_group_debts` will be created. For the MVP, this function can be executed by any authenticated user.
* **High-Level Algorithm:**
    1.  **Fetch Balances:** The function queries the `group_balances` view to get the current net balance for every active member in the group.
    2.  **Identify Debtors & Creditors:** The function partitions the list of members into two groups: **Debtors** (negative balance) and **Creditors** (positive balance).
    3.  **Calculate Transactions:** It uses a greedy algorithm to create a list of simplified payments. It repeatedly matches the largest debtor with the largest creditor, creating a transaction for the smallest of the two amounts, until all balances are resolved to zero.
    4.  **Record Simplified Payments:** For each calculated payment, the RPC will internally call the logic to create a new, auto-confirmed `'settlement'` post. These new posts represent the simplified debt settlement.
    5.  **Create Summary Post:** Finally, the function creates a single summary `post` with `type` = `'simplification_event'`. The `title` will be something like "Debts Simplified," and a `JSONB` column will contain the list of transactions that were created, providing a clear record of the event in the group feed. ✨

# **Web App Functional Requirements**

## **1.0 Overview**

This document outlines the functional requirements for a web application designed to help groups of users (e.g., roommates, friends) track and manage shared expenses and debts. The system will allow users to create groups, log expenses, and record settlements.

## **2.0 User Roles**

* **User:** A standard registered user. Can create groups, invite others, create and edit expenses, and record settlements.
* **Group Admin:** A user with all the privileges of a standard User, plus the ability to remove members from a group and initiate debt simplification. The creator of a group is its first Admin.

## **3.0 Functional Requirements**

### **3.1 User Account Management**

* **3.1.1 Registration:** Users must be able to create a new account using their First Name, Last Name, Email, and a Password.
* **3.1.2 Login:** Registered users must be able to log in using their email and password.
* **3.1.3 Password Reset:** A user must be able to request a password reset link, which will be sent to their registered email address.
* **3.1.4 User Profile:**
    * Users must have a profile page where they can edit their name and password.
    * The profile page must include an optional section for users to add their payment information (e.g., Venmo/Cash App usernames, Zelle phone number) for informational purposes.

### **3.2 Group Management**

* **3.2.1 Group Creation:** Any registered user can create a new group, becoming its first Group Admin.
* **3.2.2 Member Invitations:** Any member of a group can invite new users to join by providing their email address. The system will send an email invitation to the specified address. If the invited user already has an account, they will also receive an in-app notification.
* **3.2.3 Removing Members:** Only a Group Admin can remove another member from the group.
* **3.2.4 Leaving a Group:** Any user can choose to leave a group at any time.
* **3.2.5 Admin Transfer on Departure:** If a Group Admin attempts to leave a group, they must first designate another member as the new Admin before the action can be completed.
* **3.2.6 "Frozen" Member State:** When a user leaves or is removed from a group:
    * Their current owed/owing balances with all remaining members are preserved ("frozen").
    * They will no longer appear in the member selection list when creating *new* expenses.
    * They can still be included in an *edit* of a pre-existing expense that was created before their departure.
* **3.2.7 Group History Tabs:**
    * Within a group, departed members will be moved from the active members list to a "Previous Members" tab.
    * For a user who has left a group, that group will be moved from their active groups list to a "Previous Groups" tab, where they can view their frozen balances. They will not receive notifications from previous groups.
* **3.2.8 Group Persistence:** Groups cannot be deleted. A group will persist even if all members leave, preserving the history of all transactions and frozen balances.

### **3.3 Expense & Post Management**

* **3.3.1 Post Feed:** Each group must have a central feed displaying all expense and settlement posts in reverse chronological order (newest first).
* **3.3.2 Dashboard Summary:** The main group page must display a summary for each member, showing their total amount owed (in red) or the total amount they are owed (in green).
* **3.3.3 Expense Post Creation:** A user can create an expense post with the following attributes:
    * A name/title for the charge.
    * An optional, longer description for the expense.
    * The date the expense occurred (defaults to the current day).
    * The total cost.
    * The member who paid (defaults to the post creator).
    * The members who owe for the charge.
    * An optional field to upload an image (e.g., a receipt).
* **3.3.4 Pending Expense Posts:** A user can create a post with an "unknown" amount. This post will be marked as "Pending" in the feed and will not affect group balances until a total cost is added.
* **3.3.5 Post Editing:** Any member of a group can edit any post within that group.
* **3.3.6 Edit History:** Every post must have a viewable edit history that logs each change, including the author of the change and a timestamp.

### **3.4 Debt Splitting Logic**

* **3.4.1 Equal Split (Default):** When creating an expense, the cost will be split equally by default among all selected members.
* **3.4.2 Split by Exact Amount:** The user must have the option to assign specific, exact monetary amounts to one or more members.
* **3.4.3 Hybrid Split Calculation:** The system will calculate splits by first subtracting all assigned exact amounts from the total cost. The remaining amount will then be split equally among the rest of the selected members.
* **3.4.4 Input Validation:** The system must prevent the sum of user-entered exact amounts from exceeding the expense's total cost.

### **3.5 Debt Settlement**

* **3.5.1 Offline Payment Tracking:** The application will not process real money. It will only serve to track payments made between users via external methods.
* **3.5.2 Settlement Posts:**
    * A payment between two users is recorded as a "settlement post" in the group feed.
    * Either the sender or the recipient of the money can create the settlement post.
    * Partial payments must be supported.
* **3.5.3 Recipient Confirmation Workflow:**
    * If the *recipient* creates the post, it is automatically confirmed.
    * If the *sender* creates the post, it is marked "Awaiting Confirmation." The group balances must be updated immediately to reflect the pending payment.
    * The recipient must be prompted to either **Confirm** or **Deny** the pending payment.
    * If confirmed, the post's status is finalized.
    * If denied, the post is marked as "Invalid," and the balance changes are reverted. This reversion must function correctly even if it involves a "frozen" member.
* **3.5.4 Debt Simplification:**
    * A Group Admin must have an option to "Simplify Group Debts."
    * When activated, this feature will calculate the most direct payment paths to settle all debts within the group.
    * It will then create a single, detailed post in the feed showing how debts were re-assigned.

### **3.6 General Functionality**

* **3.6.1 Currency:** The application will be fixed to a single currency: United States Dollar (USD). All values will be assumed to be in USD.
* **3.6.2 Expense Feed Filtering:** The group expense feed must be filterable. Users must be able to filter the feed based on:
    * Post title (text search).
    * The member who paid for the expense.
    * The members involved in an expense.
* **3.6.3 Expense Detail View:** Clicking on a post in the feed will navigate the user to a dedicated detail page for that specific post.
* **3.6.4 Edit History Display:** The edit history for a post will be displayed on its dedicated detail page. The history will log the initial creation event and all subsequent edits. An "edit" is defined as a batch of changes made in a single save action, and each entry must be logged with the author's name and a timestamp.

### **3.7 Notifications**

* **3.7.1 In-App Notification System:** The application will provide an in-app notification system accessible via a bell icon in the user interface, which will lead to a notifications page. There will be no email or push notifications.
* **3.7.2 Notification Triggers:** A user must receive a notification under the following conditions:
    * When another member adds a new expense that they are involved in.
    * When an expense they are involved in is edited by another member.
    * When another member records a settlement payment sent *to them* (requiring their confirmation).
    * When a settlement payment *they sent* is confirmed by the recipient.

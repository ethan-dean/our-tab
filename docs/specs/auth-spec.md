# Authentication Technical Specification (`auth-spec.md`)

* **Version:** 1.0
* **Date:** October 13, 2025
* **Author:** Gemini

---

## 1.0 Overview

This document outlines the technical design and implementation strategy for the user authentication system. The primary goal is to provide secure and robust user registration, login, and session management.

The core of our authentication architecture will be **Supabase Auth**. By leveraging this Backend-as-a-Service (BaaS) solution, we abstract away the complexities of password hashing, email verification, secure token generation, and user table management. This allows us to focus on the frontend implementation and integration. All authentication-related API traffic will be sent directly from the client to Supabase.

---

## 2.0 Core Architecture & Technology

* **Authentication Provider:** **Supabase Auth** will serve as the single source of truth for user identities and session management. We will utilize its built-in endpoints for all auth-related actions.
* **Frontend Library:** The **`@supabase/supabase-js`** client library will be used within the TypeScript-React application to interface with Supabase Auth.
* **Session Management:** Sessions will be managed using **JSON Web Tokens (JWTs)** issued by Supabase upon successful login. The `supabase-js` client will handle the storage and automatic refreshing of these tokens.



---

## 3.0 Authentication Flows

### 3.1 User Registration (FR 3.1.1)

1.  **Client-Side:** The user submits their First Name, Last Name, Email, and Password via the React registration form.
2.  **API Call:** The frontend calls the `supabase.auth.signUp()` method. The `firstName` and `lastName` will be passed inside the `options.data` object.
3.  **Supabase Backend:**
    * Supabase validates the credentials.
    * It creates a new user record in the `auth.users` table.
    * The `firstName` and `lastName` are stored in the `user_metadata` JSONB column.
    * By default, Supabase sends a confirmation email to the user's address to verify their account. The user record remains unconfirmed until the link is clicked.

### 3.2 User Login (FR 3.1.2)

1.  **Client-Side:** The user enters their email and password into the login form.
2.  **API Call:** The frontend calls the `supabase.auth.signInWithPassword()` method.
3.  **Supabase Backend:** Supabase verifies the credentials against the hashed password in the `auth.users` table.
4.  **Token Issuance:** Upon success, Supabase returns a session object containing an `access_token` (JWT) and a `refresh_token` to the client. The `supabase-js` library automatically stores this session information securely in the browser's `localStorage`.

### 3.3 Session Persistence & Authenticated Requests

1.  **Initialization:** On application load, the `supabase-js` client will attempt to retrieve the session from `localStorage`.
2.  **State Management:** A global React Context (e.g., `AuthContext`) will be used to hold the user's session state and make it available throughout the component tree. This context will listen for authentication state changes using `supabase.auth.onAuthStateChange()`.
3.  **Authenticated API Calls:** For any request to protected Supabase endpoints (e.g., fetching group data), the `supabase-js` client will automatically attach the stored JWT to the `Authorization` header as a `Bearer` token.
4.  **Supabase:** Supabase validates the JWT from the `Authorization` header to authenticate the request before processing it.

### 3.4 Password Reset (FR 3.1.3)

1.  **Request:** The user enters their email on the "Forgot Password" page. The client calls `supabase.auth.resetPasswordForEmail()`. Supabase sends a password reset link to the provided email.
2.  **Update:** The user clicks the link, which directs them to a dedicated password reset page in the React app. The frontend captures the `access_token` from the URL fragment.
3.  **Confirmation:** The user submits their new password. The client calls `supabase.auth.updateUser()` with the new password, which finalizes the reset process.

---

## 4.0 Technical Implementation Details

### 4.1 Frontend (TypeScript-React)

* **Supabase Client:** A singleton instance of the Supabase client will be initialized using the public `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which will be stored as environment variables (e.g., `VITE_SUPABASE_URL`).
* **Auth Context:** An `AuthContext.tsx` will be created to provide the `session`, `user`, and auth-related functions (`signUp`, `signIn`, `signOut`) to the entire application. This avoids prop-drilling and centralizes auth logic.
* **Protected Routes:** A higher-order component or a custom route component will be implemented to check for an active session in the `AuthContext`. It will redirect unauthenticated users from protected pages to the login page.

### 4.2 Security & Data Access

* **Environment Variables:** All sensitive keys (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and URLs must be managed through environment variables and must not be hardcoded in the source code.
* **Row Level Security (RLS):** Supabase's RLS will be heavily utilized. After a user is authenticated via their JWT, RLS policies on database tables (e.g., `groups`, `expenses`) will ensure they can only read or write data they are permitted to access. For example, a policy on the `groups` table would check if `auth.uid()` exists in that group's `members` list. This is the primary mechanism for data authorization.

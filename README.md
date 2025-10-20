# OurTab - Shared Expense Tracking

OurTab is a web application designed to help groups of users (like roommates, friends, or travel companions) easily track and manage shared expenses and debts. It provides a clear, real-time view of who owes what, simplifying the process of settling up.

The application is built as a modern monorepo with a React/TypeScript frontend, a Node.js/Express backend, and a Supabase (PostgreSQL) database.

## Key Features

- **Group Management:** Create groups, invite members via email, and manage group roles (Admin, Member).
- **Expense Tracking:** Log shared expenses with detailed information, including title, amount, date, and an optional receipt image.
- **Flexible Debt Splitting:** Split costs equally, by exact amounts, or using a hybrid calculation that handles both simultaneously.
- **Settlement Tracking:** Record payments between members to settle debts. A confirmation workflow ensures all parties agree.
- **Debt Simplification:** Admins can trigger a feature to calculate the most efficient payment paths to clear all debts within the group.
- **Real-time Balances:** A clear dashboard summary shows each member's net balance—who owes money and who is owed money.
- **Post Feed:** A central, chronological feed of all expenses and settlements within a group.
- **Persistent History:** Groups and transaction histories are preserved, even when members leave. Inactive members are moved to a "Previous Members" tab, maintaining a record of their frozen balances.
- **User Profiles:** Users can manage their name, password, and optional payment information (e.g., Venmo, Zelle).
- **In-App Notifications:** Get notified for key events like new expenses, edits, settlement requests, and group invites.

## Tech Stack

- **Frontend:**
  - React (with Vite)
  - TypeScript
  - TanStack React Query (for server state management)
  - React Router (for client-side routing)
  - CSS Modules

- **Backend:**
  - Node.js with Express
  - TypeScript

- **Database:**
  - Supabase (PostgreSQL)
  - Supabase Auth for user management
  - Supabase Functions for serverless logic (e.g., sending invites)
  - Supabase Storage for image uploads

- **Deployment & CI/CD:**
  - GitHub Actions for automated deployments.
  - PM2 for process management on the server.
  - Rsync for efficient file synchronization.

## Project Structure

The project is organized into a monorepo structure:

```
/
├── backend/         # Node.js/Express backend server
├── docs/            # Project documentation and architecture diagrams
├── frontend/        # React/Vite frontend application
├── supabase/        # Supabase migrations and edge functions
└── .github/         # GitHub Actions workflows for CI/CD
```

## Getting Started

### Prerequisites

- Node.js
- npm (or a compatible package manager)
- A Supabase project for the database and authentication.

### Environment Setup

You will need to create environment files for both the frontend and backend.

1.  **Frontend:** Create a `.env` file in the `frontend/` directory with your Supabase public keys:
    ```
    VITE_SUPABASE_URL=your-supabase-project-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

2.  **Backend:** Create a `.env` file in the `backend/` directory. The backend server port can be configured here if needed.
    ```
    SERVER_PORT=5000
    ```

### Installation

Install dependencies for both the frontend and backend.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

1.  **Run the Backend Server:**
    From the `backend/` directory:
    ```bash
    npm run start
    ```
    The backend will compile the TypeScript code and start the server, typically on port 5000.

2.  **Run the Frontend Development Server:**
    From the `frontend/` directory:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

Deployment is automated via a GitHub Actions workflow defined in `.github/workflows/deploy.yml`.

- **Trigger:** A push to the `main` branch.
- **Process:**
  1. The workflow checks out the code.
  2. It builds the frontend application.
  3. The compiled frontend assets are moved into the backend's `dist/client/` directory.
  4. The backend TypeScript code is compiled.
  5. `rsync` is used to sync the entire built backend (including the frontend client) to the production server.
  6. `pm2` is used on the server to restart the application, ensuring zero-downtime updates.

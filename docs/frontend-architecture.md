Frontend Architecture Plan

The architecture will be based on a Feature-Sliced Design approach. This is a scalable and maintainable pattern where the
code is organized by application features (e.g., auth, expenses, groups) rather than by technical type (e.g., a single
folder for all components, another for all hooks).

Core Principles:

 1. Separation of Concerns:
     * `pages/`: Top-level components that correspond to a specific URL route. They are responsible for composing the features
        and layouts that make up a page.
     * `features/`: Contain the "smart" components. A feature encapsulates a piece of business logic, including data fetching,
        state management, and the UI to interact with it (e.g., an expense creation form, a group list).
     * `components/`: A library of "dumb," reusable UI components that are shared across multiple features (e.g., Button,
       Input, Modal). They receive props and render UI, but don't contain business logic.
     * `lib/`: A dedicated layer for all interactions with external services. This is where the Supabase client will be
       initialized and where all API functions for fetching and updating data will reside. This isolates data-fetching logic
       from the UI.
     * `hooks/`: Custom, reusable React hooks that can be shared across the application.
     * `routes/`: A centralized definition of all application routes using react-router-dom.
     * `types/`: Centralized TypeScript definitions, especially for the data models coming from the Supabase backend.

 2. State Management:
     * Global Auth State: React Context (AuthProvider) will be used to manage the user's session. It will wrap the entire
       application and provide the current user and session status to all components.
     * Form & Local State: Complex local state, like the expense splitting logic, will be managed within the relevant feature
       component using hooks like useState and useReducer.
     * Server Cache State: We will use a library like React Query (@tanstack/react-query) to manage server state, including
       data fetching, caching, and synchronization. This simplifies loading/error states and keeps the UI in sync with the
       backend.

 3. Routing:
     * react-router-dom will manage all client-side routing.
     * A ProtectedRoute component will be created to guard routes that require authentication, redirecting unauthenticated
       users to the login page.

 4. Styling:
     * We will use CSS Modules for component-level styling to ensure class names are locally scoped and avoid conflicts.
     * A global CSS file (src/index.css) will be used for base styles, CSS variables, and resets.

Proposed Frontend File Tree

Here is the proposed file tree structure for the src directory.

/frontend/src/
├── App.tsx                 # Root component: sets up router and global providers.
├── main.tsx                # (Exists) Application entry point.
├── index.css               # (Exists) Global styles, variables, and resets.
│
├── assets/                 # Static assets like images, fonts, etc.
│   └── react.svg
│
├── components/             # Shared, reusable, "dumb" UI components.
│   ├── ui/
│   │   ├── Button.tsx      # General-purpose button.
│   │   ├── Input.tsx       # General-purpose text input.
│   │   ├── Modal.tsx       # Reusable modal/dialog component.
│   │   ├── Spinner.tsx     # Loading spinner.
│   │   └── Avatar.tsx      # Component to display user avatar/initials.
│   └── layout/
│       ├── Navbar.tsx      # Top navigation bar with logo, user menu, etc.
│       └── PageLayout.tsx  # Consistent layout for all pages (e.g., max-width).
│
├── features/               # Self-contained application features.
│   ├── auth/
│   │   ├── AuthProvider.tsx  # Context provider for user session state.
│   │   ├── LoginForm.tsx     # The login form component.
│   │   └── RegisterForm.tsx  # The registration form component.
│   ├── group/
│   │   ├── CreateGroupForm.tsx # Form to create a new group.
│   │   ├── GroupHeader.tsx     # Displays group name and actions (invite, simplify).
│   │   ├── GroupList.tsx       # Displays the list of user's active/previous groups.
│   │   └── MemberBalances.tsx  # The summary of who owes what within a group.
│   └── post/
│       ├── ExpenseForm/      # Folder for the complex expense form feature.
│       │   ├── ExpenseForm.tsx # Main form component with split logic.
│       │   └── useExpenseSplit.ts # Hook to manage the hybrid split calculation.
│       ├── PostCard.tsx        # A single card in the feed (expense or settlement).
│       ├── PostFeed.tsx        # The main feed of all posts in a group.
│       ├── PostHistory.tsx     # Displays the edit history for a post.
│       └── SettlementForm.tsx  # Form for creating a settlement.
│
├── hooks/                  # Shared, reusable custom hooks.
│   └── useAuth.ts            # Hook to easily access auth context (user, session).
│
├── lib/                    # Libraries, helpers, and API communication.
│   ├── supabaseClient.ts     # Initializes and exports the singleton Supabase client.
│   └── api.ts                # A single file or folder containing all data-fetching functions.
│
├── pages/                  # Top-level components for each route.
│   ├── RootLayout.tsx        # Main layout with Navbar, renders child routes via <Outlet>.
│   ├── DashboardPage.tsx     # Main page for a logged-in user, shows their groups.
│   ├── GroupPage.tsx         # Page for a single group, showing feed and balances.
│   ├── LandingPage.tsx       # The page for non-authenticated users.
│   ├── LoginPage.tsx         # Login page.
│   ├── NotFoundPage.tsx      # 404 error page.
│   ├── PostDetailPage.tsx    # Detailed view for a single post.
│   ├── ProfilePage.tsx       # User's profile page.
│   └── RegisterPage.tsx      # Registration page.
│
├── routes/                 # Centralized routing configuration.
│   ├── index.tsx             # Defines all app routes using react-router-dom.
│   └── ProtectedRoute.tsx    # Component to guard routes that require authentication.
│
└── types/                  # TypeScript type definitions.
    └── database.ts           # Types for Supabase tables (Profile, Group, Post, etc.).

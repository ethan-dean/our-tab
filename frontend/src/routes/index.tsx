import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../pages/RootLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

import GroupPage from '../pages/GroupPage';

import ProfilePage from '../pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // Public routes
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          {
            path: 'group/:groupId',
            element: <Outlet />,
            children: [
              { index: true, element: <GroupPage /> },
              { path: 'post/:postId', element: <PostDetailPage /> },
            ]
          },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
]);

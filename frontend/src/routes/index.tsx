import { createBrowserRouter, Outlet } from 'react-router-dom';
import RootLayout from '../pages/RootLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

import GroupPage from '../pages/GroupPage';
import PostDetailPage from '../pages/PostDetailPage';

import ProfilePage from '../pages/ProfilePage';

import NotificationsPage from '../pages/NotificationsPage';

import AcceptInvitePage from '../pages/AcceptInvitePage';

import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

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
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'update-password', element: <ResetPasswordPage /> },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'accept-invite', element: <AcceptInvitePage /> },
          { path: 'notifications', element: <NotificationsPage /> },
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

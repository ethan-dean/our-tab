import React from 'react';
import LoginForm from '../features/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { authError } = useAuth();

  return (
    <div>
      <LoginForm inviteError={authError} />
    </div>
  );
};

export default LoginPage;

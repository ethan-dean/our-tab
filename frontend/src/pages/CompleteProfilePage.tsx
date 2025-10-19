import React from 'react';
import CompleteProfileForm from '../features/auth/CompleteProfileForm';

const CompleteProfilePage: React.FC = () => {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>Welcome!</h2>
        <p>Let's finish setting up your account.</p>
      </div>
      <CompleteProfileForm />
    </div>
  );
};

export default CompleteProfilePage;

import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>404</h1>
      <h2>Oops! Page Not Found.</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
};

export default NotFoundPage;
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';

const DashboardRedirectPage: React.FC = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until the authentication check is complete and profile is loaded
    if (!loading) {
      const lastVisitedGroupId = localStorage.getItem('lastVisitedGroupId');
      if (lastVisitedGroupId) {
        navigate(`/group/${lastVisitedGroupId}`, { replace: true });
        return;
      }

      navigate('/manage-groups', { replace: true });
    }
  }, [loading, profile, navigate]);

  // Display a loading spinner while the logic runs
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Spinner />
      <p>Loading your dashboard...</p>
    </div>
  );
};

export default DashboardRedirectPage;

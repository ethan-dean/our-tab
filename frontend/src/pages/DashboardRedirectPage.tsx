import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails } from '../lib/api';
import Spinner from '../components/ui/Spinner';

const DashboardRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const lastVisitedGroupId = localStorage.getItem('lastVisitedGroupId');

  const { isSuccess, isError } = useQuery({
    queryKey: ['group', lastVisitedGroupId],
    queryFn: () => getGroupDetails(lastVisitedGroupId!),
    enabled: !!lastVisitedGroupId, // Only run if the groupId exists
    retry: 1, // Don't retry excessively if the group is invalid
  });

  useEffect(() => {
    // If there's no stored group, or if the fetch fails, go to group management
    if (!lastVisitedGroupId || isError) {
      navigate('/manage-groups', { replace: true });
      return;
    }

    // If the fetch is successful, go to the group page
    if (isSuccess) {
      navigate(`/group/${lastVisitedGroupId}`, { replace: true });
    }
  }, [isSuccess, isError, lastVisitedGroupId, navigate]);

  // Display a loading spinner while the logic runs
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Spinner />
      <p>Loading your dashboard...</p>
    </div>
  );
};

export default DashboardRedirectPage;

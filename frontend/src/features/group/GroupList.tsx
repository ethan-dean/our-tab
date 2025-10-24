import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getUserGroups } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';

const GroupList: React.FC = () => {
  const { user } = useAuth();
  const { data: groupMembers, isLoading, isError, error } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getUserGroups(user.id);
    },
    enabled: !!user, // Only run the query if the user is available
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  const activeGroups = groupMembers?.filter(gm => gm.status === 'active') || [];
  const previousGroups = groupMembers?.filter(gm => gm.status === 'inactive') || [];

  return (
    <div style={{marginTop: '20px'}}>
      <section>
        <h3>Active Groups</h3>
        {activeGroups.length > 0 ? (
          <ul>
            {activeGroups.map(gm => (
              gm.groups && (
                <li key={gm.groups.id}>
                  <Link to={`/group/${gm.groups.id}`}>{gm.groups.name}</Link>
                </li>
              )
            ))}
          </ul>
        ) : (
          <p>You are not a member of any active groups.</p>
        )}
      </section>

      {previousGroups.length > 0 && (
        <section>
          <h3>Previous Groups</h3>
          <ul>
            {previousGroups.map(gm => (
              gm.groups && (
                <li key={gm.groups.id}>
                  <Link to={`/group/${gm.groups.id}`}>{gm.groups.name}</Link>
                </li>
              )
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default GroupList;

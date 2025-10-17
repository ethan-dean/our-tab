import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getGroupDetails, add_user_to_group } from '../../lib/api';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification }: { notification: any }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch data specifically for group invites
  const { data: inviter, isLoading: isLoadingInviter } = useQuery({
    queryKey: ['profile', notification.triggering_user_id],
    queryFn: () => getProfile(notification.triggering_user_id),
    enabled: notification.type === 'group_invite',
  });

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', notification.group_id],
    queryFn: () => getGroupDetails(notification.group_id),
    enabled: notification.type === 'group_invite',
  });

  const joinMutation = useMutation({
    mutationFn: () => add_user_to_group(notification.group_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      navigate(`/group/${notification.group_id}`);
    },
  });

  const renderContent = () => {
    switch (notification.type) {
      case 'group_invite':
        if (isLoadingInviter || isLoadingGroup) return <p>Loading invite...</p>;
        if (!inviter || !group) return <p>Could not load invite details.</p>;
        
        return (
          <div>
            <p>
              <strong>{inviter.first_name} {inviter.last_name}</strong> invited you to join the group <strong>{group.name}</strong>.
            </p>
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining...' : 'Join Group'}
            </Button>
            {joinMutation.isError && <p style={{color: 'red'}}>{joinMutation.error.message}</p>}
          </div>
        );

      // Future cases for other notification types can be added here
      // case 'new_expense':
      //   return <p>You were added to a new expense.</p>;

      default:
        return <p>You have a new notification.</p>;
    }
  };

  return (
    <div style={{ border: '1px solid #444', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
      {renderContent()}
      <small style={{ display: 'block', marginTop: '0.5rem', color: '#888' }}>
        {new Date(notification.created_at).toLocaleString()}
      </small>
    </div>
  );
};

export default NotificationItem;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import NotificationItem from '../features/notifications/NotificationItem';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: notifications, isLoading, isError, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getNotifications(user.id);
    },
    enabled: !!user,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  return (
    <div>
      <h1>Notifications</h1>
      {notifications && notifications.length > 0 ? (
        <div>
          {notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      ) : (
        <p>You have no notifications.</p>
      )}
    </div>
  );
};

export default NotificationsPage;

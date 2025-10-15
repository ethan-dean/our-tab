import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import GroupHeader from '../features/group/GroupHeader';
import MemberBalances from '../features/group/MemberBalances';
import PostFeed from '../features/post/PostFeed';
import styles from './GroupPage.module.css';
import Button from '../components/ui/Button';

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();

  const { data: group, isLoading, isError, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => {
      if (!groupId) throw new Error('Group ID is required');
      return getGroupDetails(groupId);
    },
    enabled: !!groupId,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;
  if (!group || !groupId) return <p>Group not found.</p>;

  return (
    <div>
      <GroupHeader group={group} />
      <div style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
        <Button>+ Add Expense</Button>
        <Button variant="secondary">+ Add Settlement</Button>
      </div>
      <div className={styles.gridContainer}>
        <main className={styles.mainContent}>
          <PostFeed groupId={groupId} />
        </main>
        <aside className={styles.sidebar}>
          <MemberBalances groupId={groupId} />
        </aside>
      </div>
    </div>
  );
};

export default GroupPage;

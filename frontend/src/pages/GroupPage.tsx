import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails } from '../lib/api';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Spinner from '../components/ui/Spinner';
import GroupHeader from '../features/group/GroupHeader';
import MemberBalances from '../features/group/MemberBalances';
import PostFeed from '../features/post/PostFeed';
import Button from '../components/ui/Button';
import BottomNav from '../components/layout/BottomNav';
import styles from './GroupPage.module.css';

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeView, setActiveView] = useState<'balances' | 'posts'>(
    isMobile ? 'balances' : 'posts'
  );

  useEffect(() => {
    if (isMobile) {
      setActiveView('balances');
    } else {
      setActiveView('posts');
    }
  }, [isMobile]);

  useEffect(() => {
    if (groupId) {
      localStorage.setItem('lastVisitedGroupId', groupId);
    }
  }, [groupId]);

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
      <div className={styles.buttonContainer}>
        <Link to={`/group/${groupId}/add-expense`}><Button size="smMd">+ Add Expense</Button></Link>
        <Link to={`/group/${groupId}/add-settlement`}><Button size="smMd" variant="secondary">+ Add Settlement</Button></Link>
        <Link to={`/group/${groupId}/invite`}><Button size="smMd" variant="secondary">Invite Member</Button></Link>
      </div>
      <div className={styles.gridContainer}>
        <main className={styles.mainContent}>
          {activeView === 'posts' ? <PostFeed groupId={groupId} /> : <MemberBalances groupId={groupId} />}
        </main>
        <aside className={styles.sidebar}>
          <MemberBalances groupId={groupId} />
        </aside>
      </div>

      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
};

export default GroupPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import GroupHeader from '../features/group/GroupHeader';
import MemberBalances from '../features/group/MemberBalances';
import PostFeed from '../features/post/PostFeed';
import ExpenseForm from '../features/post/ExpenseForm/ExpenseForm';
import SettlementForm from '../features/post/SettlementForm';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import styles from './GroupPage.module.css';

import InviteForm from '../features/group/InviteForm';

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [modalContent, setModalContent] = useState<'expense' | 'settlement' | 'invite' | null>(null);

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
      <div style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
        <Button onClick={() => setModalContent('expense')}>+ Add Expense</Button>
        <Button onClick={() => setModalContent('settlement')} variant="secondary">+ Add Settlement</Button>
        <Button onClick={() => setModalContent('invite')} variant="secondary">Invite Member</Button>
      </div>
      <div className={styles.gridContainer}>
        <main className={styles.mainContent}>
          <PostFeed groupId={groupId} />
        </main>
        <aside className={styles.sidebar}>
          <MemberBalances groupId={groupId} />
        </aside>
      </div>

      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)}>
        {modalContent === 'expense' && (
          <ExpenseForm group={group} onSuccess={() => setModalContent(null)} />
        )}
        {modalContent === 'settlement' && (
          <SettlementForm group={group} onSuccess={() => setModalContent(null)} />
        )}
        {modalContent === 'invite' && (
          <InviteForm groupId={group.id} onSuccess={() => setModalContent(null)} />
        )}
      </Modal>
    </div>
  );
};

export default GroupPage;

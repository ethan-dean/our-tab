import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGroupDetails } from '../lib/api';
import ExpenseForm from '../features/post/ExpenseForm/ExpenseForm';
import Spinner from '../components/ui/Spinner';

const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  const { data: group, isLoading, isError, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => {
      if (!groupId) throw new Error('Group ID is required');
      return getGroupDetails(groupId);
    },
    enabled: !!groupId,
  });

  if (!groupId) return <p>Group not found.</p>;

  return (
    <div>
      {isLoading && <Spinner />}
      {isError && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {group && (
        <ExpenseForm group={group} onSuccess={() => navigate(`/group/${groupId}`)} />
      )}
    </div>
  );
};

export default AddExpensePage;

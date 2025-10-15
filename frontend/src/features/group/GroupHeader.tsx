import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simplifyDebts } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

// Define a more specific type for the group details prop
interface GroupDetail {
  id: string;
  name: string;
  group_members: {
    user_id: string;
    role: string;
  }[];
}

interface GroupHeaderProps {
  group: GroupDetail;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ group }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = group.group_members.some(member => member.user_id === user?.id && member.role === 'admin');

  const simplifyMutation = useMutation({
    mutationFn: () => simplifyDebts(group.id),
    onSuccess: () => {
      // Refetch posts for this group to show the new simplification event and settlements
      queryClient.invalidateQueries({ queryKey: ['posts', group.id] });
      // Optionally, refetch balances as well
      queryClient.invalidateQueries({ queryKey: ['balances', group.id] });
    },
  });

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>{group.name}</h1>
      <div>
        {isAdmin && (
          <Button 
            onClick={() => simplifyMutation.mutate()} 
            disabled={simplifyMutation.isPending}
          >
            {simplifyMutation.isPending ? 'Simplifying...' : 'Simplify Group Debts'}
          </Button>
        )}
        {/* Add other buttons like 'Invite Member' here */}
      </div>
      {simplifyMutation.isError && <p style={{color: 'red'}}>Error: {simplifyMutation.error.message}</p>}
    </header>
  );
};

export default GroupHeader;

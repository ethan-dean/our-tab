import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSettlement } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { type Profile } from '../../types/database';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

import styles from '../auth/Form.module.css';

interface SettlementFormProps {
  group: { id: string; group_members: { profiles: Profile }[] };
  onSuccess: () => void;
}

const SettlementForm: React.FC<SettlementFormProps> = ({ group, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(0);
  const [recipientId, setRecipientId] = useState('');

  const otherMembers = group.group_members.map(m => m.profiles).filter(p => p.id !== user?.id);

  // Set default recipient if not already set
  if (!recipientId && otherMembers.length > 0) {
    setRecipientId(otherMembers[0].id);
  }

  const mutation = useMutation({
    mutationFn: ({ groupId, recipientId, amount }: { groupId: string; recipientId: string; amount: number }) => 
      createSettlement(groupId, recipientId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', group.id] });
      queryClient.invalidateQueries({ queryKey: ['balances', group.id] });
      queryClient.invalidateQueries({ queryKey: ['pairwiseBalances', group.id] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0 && recipientId) {
      mutation.mutate({ groupId: group.id, recipientId: recipientId, amount: amount });
    }
  };

  const memberOptions = otherMembers.map(member => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}`,
  }));

  return (
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <h3>Record a Settlement</h3>
      
      <div className={styles.formField}>
        <label>You paid:</label>
        <Input 
          type="number" 
          value={amount || ''} 
          onChange={e => setAmount(parseFloat(e.target.value) || 0)} 
          required 
        />
      </div>

      <div className={styles.formField}>
        <label>To:</label>
        <Select
          options={memberOptions}
          value={recipientId}
          onChange={setRecipientId}
        />
      </div>

      <Button type="submit" disabled={mutation.isPending || !recipientId || amount <= 0}>
        {mutation.isPending ? 'Recording...' : 'Record Settlement'}
      </Button>
      {mutation.isError && <p style={{ color: 'red' }}>{mutation.error.message}</p>}
    </form>
  );
};


export default SettlementForm;

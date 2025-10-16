import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSettlement } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { type Profile } from '../../types/database';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
    mutationFn: (settlementData: { p_group_id: string; p_recipient_id: string; p_amount: number }) => 
      createSettlement(settlementData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', group.id] });
      queryClient.invalidateQueries({ queryKey: ['balances', group.id] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0 && recipientId) {
      mutation.mutate({ p_group_id: group.id, p_recipient_id: recipientId, p_amount: amount });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Record a Settlement</h3>
      <p>You paid:</p>
      <Input 
        type="number" 
        placeholder="Amount" 
        value={amount || ''} 
        onChange={e => setAmount(parseFloat(e.target.value) || 0)} 
        required 
      />
      <select value={recipientId} onChange={e => setRecipientId(e.target.value)} required>
        {otherMembers.map(member => (
          <option key={member.id} value={member.id}>
            {member.first_name} {member.last_name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={mutation.isPending || !recipientId || amount <= 0}>
        {mutation.isPending ? 'Recording...' : 'Record Settlement'}
      </Button>
      {mutation.isError && <p style={{ color: 'red' }}>{mutation.error.message}</p>}
    </form>
  );
};

export default SettlementForm;

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createInvite } from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface InviteFormProps {
  groupId: string;
  onSuccess: () => void;
}

const InviteForm: React.FC<InviteFormProps> = ({ groupId, onSuccess }) => {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: (inviteeEmail: string) => createInvite(groupId, inviteeEmail),
    onSuccess: () => {
      alert(`Invite sent to ${email}!`);
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      mutation.mutate(email.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Invite Member</h2>
      <p>Enter the email address of the person you want to invite.</p>
      {mutation.isError && <p style={{ color: 'red' }}>{mutation.error.message}</p>}
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="user@example.com"
        required
        disabled={mutation.isPending}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending...' : 'Send Invite'}
      </Button>
    </form>
  );
};

export default InviteForm;

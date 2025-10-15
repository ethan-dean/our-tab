import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGroup } from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface CreateGroupFormProps {
  onSuccess: () => void;
}

const CreateGroupForm: React.FC<CreateGroupFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      mutation.mutate(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Group</h2>
      {mutation.isError && <p style={{ color: 'red' }}>{mutation.error.message}</p>}
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group Name"
        required
        disabled={mutation.isPending}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create Group'}
      </Button>
    </form>
  );
};

export default CreateGroupForm;

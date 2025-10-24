import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, editPost } from '../../../lib/api';
import { useExpenseSplit } from './useExpenseSplit';
import { useAuth } from '../../../hooks/useAuth';
import { type Profile } from '../../../types/database';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import styles from './ExpenseForm.module.css';

interface ExpenseFormProps {
  group: { id: string; group_members: { profiles: Profile }[] };
  onSuccess: () => void;
  postToEdit?: any; // Simplified for now
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ group, onSuccess, postToEdit }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(postToEdit?.title || '');
  const [description, setDescription] = useState(postToEdit?.description || '');
  const [date, setDate] = useState(postToEdit?.date || new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState(postToEdit?.total_amount || 0);
  const [payerId, setPayerId] = useState(postToEdit?.payer_id || user?.id || '');

  const groupMembers = useMemo(() => group.group_members.map(m => m.profiles), [group.group_members]);

  const { memberSplits, splitMode, dispatch, isSplitValid } = useExpenseSplit();

  // Effect to initialize and update members when the group changes
  useEffect(() => {
    dispatch({ type: 'SET_MEMBERS', payload: { members: groupMembers, payerId: payerId } });
  }, [groupMembers, payerId, dispatch]);

  // Effect to update the total amount in the hook's state
  useEffect(() => {
    dispatch({ type: 'SET_TOTAL_AMOUNT', payload: totalAmount });
  }, [totalAmount, dispatch]);

  // Effect to update the payer in the hook's state
  useEffect(() => {
    dispatch({ type: 'SET_PAYER', payload: payerId });
  }, [payerId, dispatch]);

  const mutation = useMutation({
    mutationFn: (data: { isEdit: boolean; payload: any }) => 
      data.isEdit 
        ? editPost(data.payload)
        : createPost(data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', group.id] });
      queryClient.invalidateQueries({ queryKey: ['balances', group.id] });
      queryClient.invalidateQueries({ queryKey: ['pairwiseBalances', group.id] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSplitValid) return;

    const splits = memberSplits.map(ms => ({ ower_id: ms.profile.id, amount: ms.calculatedAmount }));
    
    const payload = {
        group_id: group.id,
        title: title,
        description: description,
        date: date,
        total_amount: totalAmount,
        payer_id: payerId,
        image_url: null, // Image upload not implemented yet
        splits: splits,
    };

    if (postToEdit) {
        mutation.mutate({ isEdit: true, payload: { ...payload, postId: postToEdit.id } });
    } else {
        mutation.mutate({ isEdit: false, payload: payload });
    }
  };

  const memberOptions = groupMembers.map(member => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}`,
  }));

  return (
    <>
      <h3>{postToEdit ? 'Edit Expense' : 'Add New Expense'}</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.field}>
          <label>Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label>Amount</label>
          <Input
            type="number"
            value={totalAmount || ''}
            onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className={styles.field}>
          <label>Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label>Description (Optional)</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        
        <div className={styles.field}>
          <label>Paid by</label>
          <Select
            options={memberOptions}
            value={payerId}
            onChange={setPayerId}
          />
        </div>

        <div className={styles.splitSection}>
          <div className={styles.splitHeader}>
            <h4>Split</h4>
            <div className={styles.toggleButtons}>
              <Button
                type="button"
                onClick={() => dispatch({ type: 'SET_SPLIT_MODE', payload: 'even' })}
                className={splitMode === 'even' ? styles.activeToggle : ''}>
                Split Evenly
              </Button>
              <Button
                type="button"
                onClick={() => dispatch({ type: 'SET_SPLIT_MODE', payload: 'custom' })}
                className={splitMode === 'custom' ? styles.activeToggle : ''}>
                Custom Split
              </Button>
            </div>
          </div>

          {memberSplits.map(ms => (
            <div key={ms.profile.id} className={styles.memberSplitRow}>
              <div className={styles.memberInfo}>{ms.profile.first_name}</div>
              <div className={styles.splitControls}>
                {splitMode === 'even' && (
                  <Button 
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_CONTRIBUTING', payload: { userId: ms.profile.id }})}
                    className={ms.isContributing ? styles.contributing : ''}>
                    {ms.isContributing ? 'Contributing' : 'Not Contributing'}
                  </Button>
                )}
                <Input 
                  type="number" 
                  className={styles.splitInput}
                  value={ms.calculatedAmount.toFixed(2)}
                  onChange={e => dispatch({ type: 'UPDATE_SPLIT_VALUE', payload: { userId: ms.profile.id, value: e.target.value }})}
                  disabled={splitMode === 'even'}
                />
              </div>
            </div>
          ))}
          {!isSplitValid && <p className={styles.validationError}>Splits do not add up to the total amount!</p>}
        </div>

        <Button type="submit" disabled={!isSplitValid || mutation.isPending || postToEdit}>
          {mutation.isPending ? 'Saving...' : 'Save Expense'}
        </Button>
        {mutation.isError && <p className={styles.validationError}>{mutation.error.message}</p>}
      </form>
    </>
  );
};

export default ExpenseForm;

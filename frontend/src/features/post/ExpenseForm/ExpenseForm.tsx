import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, editPost } from '../../../lib/api';
import { useExpenseSplit } from './useExpenseSplit';
import { useAuth } from '../../../hooks/useAuth';
import { type Profile } from '../../../types/database';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
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

  const groupMembers = group.group_members.map(m => m.profiles);

  const { memberSplits, dispatch, totalSplitAmount, isSplitValid } = useExpenseSplit(groupMembers, totalAmount);

  useEffect(() => {
    dispatch({ type: 'SET_TOTAL_AMOUNT', payload: totalAmount });
  }, [totalAmount, dispatch]);

  const mutation = useMutation({
    mutationFn: (data: { isEdit: boolean; payload: any }) => 
      data.isEdit 
        ? editPost(data.payload)
        : createPost(data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', group.id] });
      queryClient.invalidateQueries({ queryKey: ['balances', group.id] });
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

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>{postToEdit ? 'Edit Expense' : 'Add New Expense'}</h3>
      <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
      <Input placeholder="Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} />
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      
      <div>
        <label>Paid by:</label>
        <select value={payerId} onChange={e => setPayerId(e.target.value)}>
          {groupMembers.map(member => (
            <option key={member.id} value={member.id}>
              {member.first_name} {member.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.splitSection}>
        <h4>Split</h4>
        {memberSplits.map(ms => (
          <div key={ms.profile.id} className={styles.memberSplitRow}>
            <div className={styles.memberInfo}>{ms.profile.first_name}</div>
            <Input 
              type="number" 
              className={styles.splitInput}
              value={ms.isLocked ? ms.inputValue : ms.calculatedAmount.toFixed(2)}
              onChange={e => dispatch({ type: 'UPDATE_SPLIT_VALUE', payload: { userId: ms.profile.id, value: e.target.value }})}
            />
          </div>
        ))}
        <div className={`${styles.memberSplitRow} ${styles.totalRow}`}>
            <span>Total:</span>
            <span>{totalSplitAmount.toFixed(2)}</span>
        </div>
        {!isSplitValid && <p className={styles.validationError}>Splits do not add up to the total amount!</p>}
      </div>

      <Button type="submit" disabled={!isSplitValid || mutation.isPending || postToEdit}>
        {mutation.isPending ? 'Saving...' : 'Save Expense'}
      </Button>
      {mutation.isError && <p className={styles.validationError}>{mutation.error.message}</p>}
    </form>
  );
};

export default ExpenseForm;

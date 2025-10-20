import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserPassword, updateProfile, add_user_to_group } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import styles from '../features/auth/Form.module.css';

const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshSession } = useAuth();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const gId = searchParams.get('group_id');
    if (gId) {
      setGroupId(gId);
    } else {
      // If no group ID, this page is invalid. Redirect away.
      console.error("No group ID found in URL, redirecting.");
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const completeProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user || !groupId) throw new Error("User or Group ID not found.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters long.");

      // Sequence of operations for a new user completing their profile
      // 1. Update password
      await updateUserPassword(password);
      // 2. Update profile name
      await updateProfile(user.id, { first_name: firstName, last_name: lastName });
      // 3. Add user to the group
      await add_user_to_group(groupId);
    },
    onSuccess: async () => {
      // Invalidate queries to refetch user-specific data
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      await refreshSession();
      // Redirect to the group page
      if (groupId) {
        navigate(`/group/${groupId}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeProfileMutation.mutate();
  };

  if (!groupId) {
    return <div>Loading or invalid invite link...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2>Complete Your Profile</h2>
      <p>Set your name and password to join the group.</p>
      
      <div className={styles.formField}>
        <label htmlFor="firstName">First Name</label>
        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>
      <div className={styles.formField}>
        <label htmlFor="lastName">Last Name</label>
        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      </div>
      <div className={styles.formField}>
        <label htmlFor="password">Password</label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className={styles.formField}>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>

      {completeProfileMutation.isError && (
        <p style={{ color: 'red' }}>{completeProfileMutation.error.message}</p>
      )}

      <Button type="submit" disabled={completeProfileMutation.isPending}>
        {completeProfileMutation.isPending ? 'Saving...' : 'Complete Sign-Up & Join Group'}
      </Button>
    </form>
  );
};

export default AcceptInvitePage;
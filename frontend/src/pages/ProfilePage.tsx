import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, updateUserPassword } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

import styles from '../features/auth/Form.module.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not found');
      return getProfile(user.id);
    },
    enabled: !!user,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const nameMutation = useMutation({
    mutationFn: () => updateProfile(user!.id, { first_name: firstName, last_name: lastName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      alert('Name updated successfully!');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      setPassword('');
      setConfirmPassword('');
      alert('Password updated successfully!');
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nameMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    passwordMutation.mutate(password);
  };

  if (isLoading) return <Spinner />;
  if (isError || !profile) return <p>Error loading profile.</p>;

  return (
    <div>
      <h1>Your Profile</h1>
      
      <form onSubmit={handleNameSubmit} className={styles.formContainer} style={{ maxWidth: '600px' }}>
        <h2>Update Name</h2>
        <div className={styles.formField}>
            <label>First Name</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className={styles.formField}>
            <label>Last Name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Button type="submit" disabled={nameMutation.isPending}>
          {nameMutation.isPending ? 'Saving...' : 'Save Name'}
        </Button>
        {nameMutation.isError && <p style={{color: 'red'}}>{nameMutation.error.message}</p>}
      </form>

      <form onSubmit={handlePasswordSubmit} className={styles.formContainer} style={{ maxWidth: '600px' }}>
        <h2>Change Password</h2>
        <div className={styles.formField}>
            <label>New Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className={styles.formField}>
            <label>Confirm New Password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={passwordMutation.isPending}>
          {passwordMutation.isPending ? 'Saving...' : 'Change Password'}
        </Button>
        {passwordMutation.isError && <p style={{color: 'red'}}>{passwordMutation.error.message}</p>}
      </form>
    </div>
  );
};

export default ProfilePage;

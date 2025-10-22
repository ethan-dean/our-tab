import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, updateUserPassword, signOut } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { type Profile } from '../types/database';
import { useNavigate } from 'react-router-dom';

import styles from '../features/auth/Form.module.css';

const ProfilePage: React.FC = () => {
  const { user, profile, loading, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [venmo, setVenmo] = useState('');
  const [zelle, setZelle] = useState('');
  const [cashapp, setCashapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      const paymentInfo = profile.payment_info as { [key: string]: string } | null;
      setVenmo(paymentInfo?.venmo || '');
      setZelle(paymentInfo?.zelle || '');
      setCashapp(paymentInfo?.cashapp || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => {
      if (!user) throw new Error("User not authenticated");
      return updateProfile(user.id, updates);
    },
    onSuccess: async () => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      alert('Profile updated successfully!');
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

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payment_info = { venmo, zelle, cashapp };
    updateProfileMutation.mutate({ first_name: firstName, last_name: lastName, payment_info });
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

  const handleSignOut = async () => {
    await signOut();
    await refreshSession();
    navigate('/login');
  };

  if (loading) return <Spinner />;
  if (!profile) return <p>Error loading profile.</p>;

  return (
    <div>
      <form onSubmit={handleInfoSubmit} className={styles.formContainer} style={{ maxWidth: '600px' }}>
        <h2>Personal & Payment Information</h2>
        
        <div className={styles.formField}>
          <label>Email</label>
          <Input value={user?.email || ''} readOnly disabled />
        </div>

        <div className={styles.formField}>
          <label>First Name</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div className={styles.formField}>
          <label>Last Name</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <h3 style={{ marginTop: '1rem' }}>Payment Methods</h3>
        <div className={styles.formField}>
          <label>Venmo</label>
          <Input value={venmo} onChange={(e) => setVenmo(e.target.value)} placeholder="@username" />
        </div>
        <div className={styles.formField}>
          <label>Zelle</label>
          <Input value={zelle} onChange={(e) => setZelle(e.target.value)} placeholder="email or phone" />
        </div>
        <div className={styles.formField}>
          <label>Cash App</label>
          <Input value={cashapp} onChange={(e) => setCashapp(e.target.value)} placeholder="$cashtag" />
        </div>

        <Button type="submit" disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Information'}
        </Button>
        {updateProfileMutation.isError && <p style={{color: 'red'}}>{updateProfileMutation.error.message}</p>}
      </form>

      <form onSubmit={handlePasswordSubmit} className={styles.formContainer} style={{ maxWidth: '600px' }}>
        <h2>Change Password</h2>
        <div className={styles.formField}>
          <label>New Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current password" />
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

      <Button onClick={handleSignOut} variant="secondary" style={{ marginTop: '2rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
        Sign Out
      </Button>
    </div>
  );
};

export default ProfilePage;

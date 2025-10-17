import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPassword } from '../../lib/api';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'

import styles from './Form.module.css';

interface LoginFormProps {
  inviteError?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ inviteError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithPassword({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2>Login</h2>
      {inviteError && <p style={{ color: 'orange', border: '1px solid orange', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{inviteError}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className={styles.formField}>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
      <div className={styles.formLink}>
        <Link to="/forgot-password">Forgot your password?</Link>
      </div>
    </form>
  );
};

export default LoginForm;

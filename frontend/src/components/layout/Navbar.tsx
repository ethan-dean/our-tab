import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/api';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLinks}>
        <Link to="/">Home</Link>
        {user && <Link to="/dashboard">Dashboard</Link>}
      </div>
      <div className={styles.authActions}>
        {!loading && (
          <>
            {user ? (
              <button onClick={handleSignOut}>Sign Out</button>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

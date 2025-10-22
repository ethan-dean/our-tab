import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/api';
import styles from './Navbar.module.css';
import GroupsDropdown from './GroupsDropdown';
import { Bell, ChevronLeft, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    await refreshSession();
    navigate('/login');
  };

  if (location.pathname === '/notifications' || location.pathname === '/profile') {
    const title = location.pathname === '/notifications' ? 'Notifications' : 'Profile';
    return (
      <nav className={styles.navbar}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <ChevronLeft size={20} /> Back
          </button>
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
          {title}
        </div>
        <div style={{ flex: 1 }} />
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLinks}>
        {!user && <Link to="/">Home</Link>}
        {user && <GroupsDropdown />}
      </div>
      <div className={styles.authActions}>
        {!loading && (
          <>
            {user ? (
              <>
                <Link to="/notifications" className={styles.iconButton}><Bell size={24} /></Link>
                <Link to="/profile" className={styles.iconButton}><User size={24} /></Link>
              </>
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

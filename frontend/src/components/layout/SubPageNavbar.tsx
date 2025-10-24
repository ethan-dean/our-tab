import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SubPageNavbar.module.css';

const SubPageNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.includes('/notifications')) return 'Notifications';
    if (location.pathname.includes('/profile')) return 'Profile';
    if (location.pathname.includes('/post')) return 'Post Details';
    if (location.pathname.includes('/add-group')) return 'Create Group';
    if (location.pathname.includes('/add-expense')) return 'Add Expense';
    if (location.pathname.includes('/add-settlement')) return 'Add Settlement';
    if (location.pathname.includes('/invite')) return 'Invite Member';
    return 'Back'; // Fallback title
  };

  return (
    <nav className={styles.navbar}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>
      <h1 className={styles.title}>{getTitle()}</h1>
      <div className={styles.placeholder}></div> {/* To keep title centered */}
    </nav>
  );
};

export default SubPageNavbar;

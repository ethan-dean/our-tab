import React from 'react';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  activeView: 'balances' | 'posts';
  setActiveView: (view: 'balances' | 'posts') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className={styles.bottomNav}>
      <button 
        className={`${styles.navButton} ${activeView === 'balances' ? styles.active : ''}`}
        onClick={() => setActiveView('balances')}>
        Balances
      </button>
      <button 
        className={`${styles.navButton} ${activeView === 'posts' ? styles.active : ''}`}
        onClick={() => setActiveView('posts')}>
        Posts
      </button>
    </nav>
  );
};

export default BottomNav;

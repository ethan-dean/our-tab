import React from 'react';
import { Scale, List } from 'lucide-react';
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
        <Scale />
        <span>Balances</span>
      </button>
      <button 
        className={`${styles.navButton} ${activeView === 'posts' ? styles.active : ''}`}
        onClick={() => setActiveView('posts')}>
        <List />
        <span>Posts</span>
      </button>
    </nav>
  );
};

export default BottomNav;

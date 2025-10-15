import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
}

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}` || '?';
}

const Avatar: React.FC<AvatarProps> = ({ firstName, lastName }) => {
  return (
    <div className={styles.avatar}>
      {getInitials(firstName, lastName)}
    </div>
  );
};

export default Avatar;

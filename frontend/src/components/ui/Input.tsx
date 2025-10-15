import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const inputClass = `${styles.input} ${className || ''}`.trim();

  return <input className={inputClass} {...props} />;
};

export default Input;

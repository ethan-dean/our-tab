import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ options, value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.selectWrapper} ${className || ''}`} ref={selectRef}>
      {/* Native select for mobile */}
      <select 
        className={styles.nativeSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom select for desktop */}
      <div className={styles.customSelect}>
        <button type="button" className={styles.selectButton} onClick={() => setIsOpen(!isOpen)}>
          <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
          <ChevronDown size={20} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
        </button>
        {isOpen && (
          <ul className={styles.optionsList}>
            {options.map(option => (
              <li 
                key={option.value} 
                className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Select;

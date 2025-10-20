import React, { type PropsWithChildren } from 'react';
import styles from './PageLayout.module.css';

const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className={styles.layout}>{children}</div>;
};

export default PageLayout;

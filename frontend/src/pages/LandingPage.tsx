import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

const LandingPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.headline}>Stop Chasing Receipts.</h1>
        <p className={styles.subheadline}>OurTab is the simplest way for groups and friends to track shared expenses and settle up with confidence. No more spreadsheets, no more awkward reminders.</p>
        <Link to="/register" className={styles.ctaButton}>Get Started for Free</Link>
      </header>

      <main className={styles.features}>
        <h2>Your Group's Finances, Simplified.</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3>Flexible Splitting</h3>
            <p>Split expenses equally, by exact amounts, or a mix of both. OurTab handles the math for you, no matter how complicated.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Real-Time Balances</h3>
            <p>See who owes who at a glance. A clear, central dashboard shows every member's net balance, updated instantly.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Seamless Settlements</h3>
            <p>Record payments with a confirmation workflow. When someone pays you back, confirm it, and watch the balances update automatically.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Simplify Group Debt</h3>
            <p>Tired of a complex web of IOUs? Admins can trigger a feature to calculate the most efficient payment paths to clear all debts in the group.</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <h2>Ready to Settle Up?</h2>
        <p>Create an account and invite your friends today.</p>
        <Link to="/register" className={styles.ctaButton}>Sign Up Now</Link>
        <p style={{ marginTop: '2rem', color: '#888' }}>
          Already have an account? <Link to="/login">Log in here</Link>.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

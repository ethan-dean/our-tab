import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPostDetails } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import PostHistory from '../features/post/PostHistory';
import Avatar from '../components/ui/Avatar';
import styles from './PostDetailPage.module.css';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => {
      if (!postId) throw new Error('Post ID is required');
      return getPostDetails(postId);
    },
    enabled: !!postId,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;
  if (!post || !postId) return <p>Post not found.</p>;

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'Pending';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{post.title || 'Settlement'}</h1>
        <p className={styles.totalAmount}>{formatCurrency(post.total_amount)}</p>
        <div className={styles.metaInfo}>
          <span>Paid by: <strong>{post.payer.first_name} {post.payer.last_name}</strong></span>
          <span>|</span>
          <span>Date: <strong>{formatDate(post.date)}</strong></span>
        </div>
      </div>

      {post.description && (
        <section className={styles.descriptionCard}>
          <h3>Description</h3>
          <p>{post.description}</p>
        </section>
      )}

      <section className={styles.splitsCard}>
        <h3>Splits</h3>
        <ul className={styles.splitList}>
          {post.post_splits.map((split: any) => (
            <li key={split.id} className={styles.splitItem}>
              <div className={styles.splitUser}>
                <Avatar firstName={split.owers.first_name} lastName={split.owers.last_name} />
                <span>{split.owers.first_name} {split.owers.last_name}</span>
              </div>
              <span className={styles.splitAmount}>{formatCurrency(split.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <PostHistory postId={postId} />
    </div>
  );
};

export default PostDetailPage;
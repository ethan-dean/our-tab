import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPostDetails } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import PostHistory from '../features/post/PostHistory';

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

  return (
    <div>
      <header>
        <h1>{post.title || 'Settlement'}</h1>
        <p>Total Amount: {formatCurrency(post.total_amount)}</p>
        <p>Paid by: {post.payer.first_name} {post.payer.last_name}</p>
        <p>On: {new Date(post.created_at).toLocaleDateString()}</p>
      </header>

      <section style={{ marginTop: '2rem' }}>
        <h3>Splits</h3>
        <ul>
          {post.post_splits.map((split: any) => (
            <li key={split.id}>
              {split.owers.first_name} {split.owers.last_name} owes {formatCurrency(split.amount)}
            </li>
          ))}
        </ul>
      </section>

      <PostHistory postId={postId} />
    </div>
  );
};

export default PostDetailPage;

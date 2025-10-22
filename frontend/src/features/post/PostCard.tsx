import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { resolveSettlement } from '../../lib/api';
import Button from '../../components/ui/Button';
import styles from './PostCard.module.css';

// Assuming the Post type is extended by the query to include nested profiles
// This is a simplified version for the component props
type PostWithDetails = any; // Replace with a proper generated type later

interface PostCardProps {
  post: PostWithDetails;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Adjust for timezone to prevent off-by-one day errors
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return 'Pending';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: ({ action }: { action: 'confirm' | 'deny' }) => resolveSettlement(post.id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', post.group_id] });
      queryClient.invalidateQueries({ queryKey: ['balances', post.group_id] });
      queryClient.invalidateQueries({ queryKey: ['pairwiseBalances', post.group_id] });
    },
  });

  const handleCardClick = () => {
    navigate(`/group/${post.group_id}/post/${post.id}`);
  };

  const renderUserShare = () => {
    if (!user || post.type !== 'expense') return null;

    if (post.payer_id === user.id) {
      const totalOwedToUser = post.post_splits.reduce((acc: number, split: any) => {
        if (split.ower_id !== user.id) {
          return acc + split.amount;
        }
        return acc;
      }, 0);
      return <p className={`${styles.userShare} ${styles.positive}`}>You are owed {formatCurrency(totalOwedToUser)}</p>;
    }

    const userOwesSplit = post.post_splits.find((split: any) => split.ower_id === user.id);
    if (userOwesSplit) {
      return <p className={`${styles.userShare} ${styles.negative}`}>You owe {formatCurrency(userOwesSplit.amount)}</p>;
    }

    return null;
  };

  const renderSettlementActions = () => {
    const isRecipient = post.post_splits[0]?.ower_id === user?.id;
    if (post.type === 'settlement' && post.status === 'pending_confirmation' && isRecipient) {
      return (
        <div className={styles.pendingActions} onClick={(e) => e.stopPropagation()}>
          <Button onClick={() => resolveMutation.mutate({ action: 'confirm' })} disabled={resolveMutation.isPending} variant="primary">Confirm</Button>
          <Button onClick={() => resolveMutation.mutate({ action: 'deny' })} disabled={resolveMutation.isPending} variant="secondary">Deny</Button>
        </div>
      );
    }
    return null;
  };

  const getSettlementText = () => {
    const payerName = `${post.payer.first_name}`;
    const recipientName = `${post.post_splits[0].owers.first_name}`;
    return `${payerName} paid ${recipientName}`;
  }

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.cardHeader}>
        <div>
          <h4 className={styles.cardTitle}>{post.title || (post.type === 'settlement' ? getSettlementText() : 'Event')}</h4>
          <p className={styles.cardBody}>Paid by {post.payer.first_name} {post.payer.last_name}</p>
        </div>
        <div className={styles.amountContainer}>
          <span className={styles.cardAmount}>{formatCurrency(post.total_amount)}</span>
          <small className={styles.cardDate}>{formatDate(post.date)}</small>
        </div>
      </div>
      {post.status === 'pending_confirmation' && <span>Awaiting Confirmation</span>}
      {renderUserShare()}
      {renderSettlementActions()}
    </div>
  );
};

export default PostCard;
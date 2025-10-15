import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPostHistory } from '../../lib/api';
import Spinner from '../../components/ui/Spinner';
import styles from './PostHistory.module.css';

interface PostHistoryProps {
  postId: string;
}

const formatHistory = (historyItem: any) => {
    const editorName = historyItem.editor?.first_name || 'A user';
    const date = new Date(historyItem.created_at).toLocaleString();

    if (historyItem.changes?.action === 'create') {
        return `${editorName} created this post on ${date}`;
    }

    if (historyItem.changes?.action === 'edit') {
        const diff = historyItem.changes.diff;
        const changedKeys = Object.keys(diff);
        if (changedKeys.length > 0) {
            // For simplicity, just state that an edit was made.
            // A more complex implementation could detail each change.
            return `${editorName} edited this post on ${date}`;
        }
    }

    return `An unknown action was performed on ${date}`;
}

const PostHistory: React.FC<PostHistoryProps> = ({ postId }) => {
  const { data: history, isLoading, isError, error } = useQuery({
    queryKey: ['postHistory', postId],
    queryFn: () => getPostHistory(postId),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  return (
    <div className={styles.historyList}>
        <h3>History</h3>
        {history && history.length > 0 ? (
            <ul>
                {history.map(item => (
                    <li key={item.id} className={styles.historyItem}>
                        {formatHistory(item)}
                    </li>
                ))}
            </ul>
        ) : (
            <p>No history available for this post.</p>
        )}
    </div>
  );
};

export default PostHistory;

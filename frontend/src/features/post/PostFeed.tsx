import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGroupPosts } from '../../lib/api';
import Spinner from '../../components/ui/Spinner';
import styles from './PostFeed.module.css';

interface PostFeedProps {
  groupId: string;
}

import PostCard from './PostCard';

const PostFeed: React.FC<PostFeedProps> = ({ groupId }) => {
  const { data: posts, isLoading, isError, error } = useQuery({
    queryKey: ['posts', groupId],
    queryFn: () => getGroupPosts(groupId),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'red' }}>Error fetching posts: {error.message}</p>;

  return (
    <div className={styles.feedContainer}>
      {posts && posts.length > 0 ? (
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        <p>No expenses or settlements yet. Add one to get started!</p>
      )}
    </div>
  );
};

export default PostFeed;

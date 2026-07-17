import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  FOLLOW_MUTATION,
  FOLLOWERS_COUNT_QUERY,
  IS_FOLLOWING_QUERY,
  UNFOLLOW_MUTATION,
} from '@/lib/graphql/queries';

interface Props {
  /** ID of the user to follow */
  userId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FollowButton({ userId, size = 'md', className = '' }: Props) {
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const isOwnProfile = user?._id === userId;

  const { data } = useQuery<{ isFollowing: boolean }>(IS_FOLLOWING_QUERY, {
    variables: { userId },
    skip: !isAuthenticated || isOwnProfile,
    fetchPolicy: 'cache-first',
  });

  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const serverFollowing = data?.isFollowing ?? false;
  const following = optimistic !== null ? optimistic : serverFollowing;

  const refetchQueries = [
    { query: IS_FOLLOWING_QUERY, variables: { userId } },
    { query: FOLLOWERS_COUNT_QUERY, variables: { userId } },
  ];

  const [follow, { loading: following_ }] = useMutation(FOLLOW_MUTATION, {
    variables: { userId },
    refetchQueries,
  });

  const [unfollow, { loading: unfollowing }] = useMutation(UNFOLLOW_MUTATION, {
    variables: { userId },
    refetchQueries,
  });

  const loading = following_ || unfollowing;

  const handleClick = useCallback(async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (loading) return;

    const next = !following;
    setOptimistic(next);
    try {
      if (next) await follow();
      else await unfollow();
    } catch {
      setOptimistic(!next); // revert
    }
  }, [isAuthenticated, following, loading, follow, unfollow, router]);

  // Don't render anything for own profile
  if (isOwnProfile) return null;

  const base = 'inline-flex items-center gap-2 rounded-xl font-medium transition disabled:opacity-50';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
  };
  const styles = following
    ? 'border border-zinc-300 bg-white text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400'
    : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${base} ${sizes[size]} ${styles} ${className}`}
    >
      {following ? (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('social.following')}
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
          </svg>
          {t('social.follow')}
        </>
      )}
    </button>
  );
}

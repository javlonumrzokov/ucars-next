import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { HAS_LIKED_QUERY, LIKE_MUTATION, UNLIKE_MUTATION } from '@/lib/graphql/queries';

type TargetType = 'VEHICLE' | 'ARTICLE';

interface Props {
  targetType: TargetType;
  targetId: string;
  likeCount: number;
  /** visual size: 'sm' for cards, 'md' for detail pages */
  size?: 'sm' | 'md';
  className?: string;
}

export default function LikeButton({
  targetType,
  targetId,
  likeCount: initialCount,
  size = 'sm',
  className = '',
}: Props) {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Optimistic local state
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState(initialCount);

  const { data: hasLikedData } = useQuery<{ hasLiked: boolean }>(HAS_LIKED_QUERY, {
    variables: { targetType, targetId },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-first',
  });

  const serverLiked = hasLikedData?.hasLiked ?? false;
  const liked = optimisticLiked !== null ? optimisticLiked : serverLiked;

  const [likeMutation, { loading: liking }] = useMutation(LIKE_MUTATION, {
    variables: { targetType, targetId },
    refetchQueries: [{ query: HAS_LIKED_QUERY, variables: { targetType, targetId } }],
  });

  const [unlikeMutation, { loading: unliking }] = useMutation(UNLIKE_MUTATION, {
    variables: { targetType, targetId },
    refetchQueries: [{ query: HAS_LIKED_QUERY, variables: { targetType, targetId } }],
  });

  const loading = liking || unliking;

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (loading) return;

      // Optimistic update
      const next = !liked;
      setOptimisticLiked(next);
      setOptimisticCount((c) => c + (next ? 1 : -1));

      try {
        if (next) {
          await likeMutation();
        } else {
          await unlikeMutation();
        }
      } catch {
        // Revert on error
        setOptimisticLiked(!next);
        setOptimisticCount((c) => c + (next ? -1 : 1));
      }
    },
    [isAuthenticated, liked, loading, likeMutation, unlikeMutation, router],
  );

  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? t('social.unlike') : t('social.like')}
      className={`flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
        liked
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-zinc-400 hover:text-rose-500'
      } ${className}`}
    >
      <svg
        className={`${iconSize} transition-transform ${liked ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={`font-medium ${textSize}`}>{optimisticCount}</span>
    </button>
  );
}

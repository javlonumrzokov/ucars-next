import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/date-format';
import {
  COMMENTS_QUERY,
  CREATE_COMMENT_MUTATION,
  DELETE_COMMENT_MUTATION,
} from '@/lib/graphql/queries';
import type { TFunction } from 'i18next';

interface CommentAuthor {
  _id: string;
  name: string;
}

interface Comment {
  _id: string;
  author: CommentAuthor;
  content: string;
  parent: string | null;
  createdAt: string;
}

interface PaginatedComments {
  items: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

interface Props {
  targetType: 'VEHICLE' | 'ARTICLE';
  targetId: string;
}

function timeAgo(iso: string, t: TFunction, locale?: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('comments.justNow');
  if (mins < 60) return t('comments.minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('comments.hoursAgo', { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 30) return t('comments.daysAgo', { count: days });
  return formatDate(iso, locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommentSection({ targetType, targetId }: Props) {
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, loading, refetch } = useQuery<{ comments: PaginatedComments }>(COMMENTS_QUERY, {
    variables: { targetType, targetId, page, limit: 15 },
    skip: !targetId,
    fetchPolicy: 'cache-and-network',
  });

  const [createComment, { loading: submitting }] = useMutation(CREATE_COMMENT_MUTATION, {
    onCompleted: () => {
      setText('');
      setReplyTo(null);
      refetch();
    },
  });

  const [deleteComment] = useMutation(DELETE_COMMENT_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    const content = text.trim();
    if (!content) return;
    await createComment({
      variables: {
        input: {
          targetType,
          targetId,
          content,
          parent: replyTo?.id ?? null,
        },
      },
    });
  }, [isAuthenticated, text, targetType, targetId, replyTo, createComment, router]);

  const handleReply = (comment: Comment) => {
    setReplyTo({ id: comment._id, name: comment.author.name });
    textareaRef.current?.focus();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('comments.deleteConfirm'))) return;
    await deleteComment({ variables: { id } });
  };

  const comments = data?.comments?.items ?? [];
  const total = data?.comments?.total ?? 0;
  const totalPages = data?.comments?.totalPages ?? 1;

  // Group: top-level first, then replies
  const topLevel = comments.filter((c) => !c.parent);
  const replies = comments.filter((c) => !!c.parent);
  const replyMap = new Map<string, Comment[]>();
  for (const r of replies) {
    if (!r.parent) continue;
    const list = replyMap.get(r.parent) ?? [];
    list.push(r);
    replyMap.set(r.parent, list);
  }

  return (
    <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="mb-6 text-lg font-bold text-zinc-900 dark:text-white">
        {t('comments.title')}{total > 0 && <span className="ml-2 text-sm font-normal text-zinc-500">({total})</span>}
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-8">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t('comments.replyingTo')} <span className="font-medium text-zinc-900 dark:text-white">{replyTo.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (isAuthenticated && text.trim() && !submitting) {
                e.currentTarget.form?.requestSubmit();
              }
            }
          }}
          placeholder={isAuthenticated ? t('comments.placeholderAuthed') : t('comments.placeholderGuest')}
          disabled={!isAuthenticated || submitting}
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
        <div className="mt-2 flex items-center justify-between">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {t('comments.signInToComment')}
            </button>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={!isAuthenticated || submitting || !text.trim()}
              className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? t('comments.posting') : t('comments.post')}
            </button>
          </div>
        </div>
      </form>

      {/* Comment list */}
      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          {t('comments.noComments')}
        </p>
      ) : (
        <div className="space-y-6">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replies={replyMap.get(comment._id) ?? []}
              currentUserId={user?._id}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            {t('comments.prev')}
          </button>
          <span className="text-sm text-zinc-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            {t('comments.next')}
          </button>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  currentUserId?: string;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
}

function CommentItem({ comment, replies, currentUserId, onReply, onDelete }: CommentItemProps) {
  const isOwn = currentUserId === comment.author._id;

  return (
    <div>
      <SingleComment
        comment={comment}
        isOwn={isOwn}
        onReply={onReply}
        onDelete={onDelete}
      />
      {replies.length > 0 && (
        <div className="ml-8 mt-3 space-y-3 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
          {replies.map((r) => (
            <SingleComment
              key={r._id}
              comment={r}
              isOwn={currentUserId === r.author._id}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SingleComment({
  comment,
  isOwn,
  onReply,
  onDelete,
  isReply = false,
}: {
  comment: Comment;
  isOwn: boolean;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const initials = comment.author.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 ${isReply ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'}`}>
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            {comment.author.name}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {timeAgo(comment.createdAt, t, router.locale)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {comment.content}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <button
            onClick={() => onReply(comment)}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {t('comments.reply')}
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete(comment._id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              {t('comments.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { authStorage } from '@/lib/auth-storage';
import {
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  MARK_NOTIFICATION_READ_MUTATION,
  MY_NOTIFICATIONS_QUERY,
  UNREAD_NOTIFICATION_COUNT_QUERY,
} from '@/lib/graphql/queries';
import type { TFunction } from 'i18next';

interface NotificationActor {
  _id: string;
  name: string;
}

interface Notification {
  _id: string;
  actor: NotificationActor | null;
  type: 'LIKE' | 'FOLLOW' | 'COMMENT' | 'SYSTEM';
  targetType: 'VEHICLE' | 'ARTICLE' | null;
  targetId: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string, t: TFunction) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('comments.justNow');
  if (mins < 60) return t('comments.minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('comments.hoursAgo', { count: hrs });
  return t('comments.daysAgo', { count: Math.floor(hrs / 24) });
}

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'LIKE':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
      );
    case 'FOLLOW':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'COMMENT':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </span>
      );
  }
}

function targetHref(n: Notification): string | null {
  if (!n.targetId || !n.targetType) return null;
  if (n.targetType === 'VEHICLE') return `/products/${n.targetId}`;
  if (n.targetType === 'ARTICLE') return `/blog/${n.targetId}`;
  return null;
}

export default function NotificationBell() {
  const { t } = useTranslation('chat');
  const { t: tc } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Unread count (fast query)
  const { data: countData, refetch: refetchCount } = useQuery<{ unreadNotificationCount: number }>(
    UNREAD_NOTIFICATION_COUNT_QUERY,
    { skip: !isAuthenticated, fetchPolicy: 'network-only', pollInterval: 60000 },
  );
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const unread = optimisticCount !== null ? optimisticCount : (countData?.unreadNotificationCount ?? 0);

  // Notifications list (loaded when dropdown opens)
  const { data: listData, loading: listLoading, refetch: refetchList } = useQuery<{
    myNotifications: { items: Notification[]; total: number; totalPages: number };
  }>(MY_NOTIFICATIONS_QUERY, {
    skip: !isAuthenticated || !open,
    variables: { page: 1, limit: 20 },
    fetchPolicy: 'network-only',
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ_MUTATION);
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION, {
    onCompleted: () => {
      setOptimisticCount(0);
      refetchList();
    },
  });

  // Real-time WebSocket connection
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = authStorage.get();
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';
    const socket = io(`${wsUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('notification', () => {
      setOptimisticCount((c) => (c !== null ? c + 1 : (countData?.unreadNotificationCount ?? 0) + 1));
      if (open) refetchList();
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      refetchCount();
      refetchList();
    }
  };

  const handleMarkRead = async (n: Notification) => {
    if (!n.read) {
      await markRead({ variables: { id: n._id } });
      setOptimisticCount((c) => Math.max(0, (c ?? unread) - 1));
      refetchList();
    }
  };

  const handleMarkAll = () => {
    markAllRead();
  };

  if (!isAuthenticated) return null;

  const notifications = listData?.myNotifications?.items ?? [];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t('notifications')}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t('notifications')}</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {listLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
                </svg>
                <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">{t('noNotifications')}</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const href = targetHref(n);
                  const content = (
                    <div
                      className={`flex gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => handleMarkRead(n)}
                    >
                      {typeIcon(n.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-zinc-800 dark:text-zinc-200">
                          {n.actor && (
                            <span className="font-semibold">{n.actor.name} </span>
                          )}
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                          {timeAgo(n.createdAt, tc)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                  );

                  return (
                    <li key={n._id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                      {href ? (
                        <Link href={href} onClick={() => { handleMarkRead(n); setOpen(false); }}>
                          {content}
                        </Link>
                      ) : (
                        <div className="cursor-default">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-zinc-200 px-4 py-2.5 dark:border-zinc-700">
              <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                {t('showingLast20')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

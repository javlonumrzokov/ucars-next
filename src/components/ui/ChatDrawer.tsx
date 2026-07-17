import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { useChat, type ChatParticipant as Participant, type ChatRoom } from '@/contexts/chat-context';
import { authStorage } from '@/lib/auth-storage';
import {
  MESSAGES_QUERY,
  MY_CHAT_ROOMS_QUERY,
  SEND_MESSAGE_MUTATION,
} from '@/lib/graphql/queries';

interface Message {
  _id: string;
  room: string;
  sender: Participant;
  content: string;
  readBy: string[];
  createdAt: string;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function roomLabel(room: ChatRoom, myId: string) {
  if (room.type === 'GROUP') return room.name ?? 'Group';
  const other = room.participants.find((p) => p._id !== myId);
  return other?.name ?? 'Unknown';
}

function roomInitials(room: ChatRoom, myId: string) {
  if (room.type === 'GROUP') return '🌐';
  const other = room.participants.find((p) => p._id !== myId);
  return other ? initials(other.name) : '?';
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
];

function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function ChatDrawer() {
  const { user, isAuthenticated } = useAuth();
  const { isOpen, activeRoomId, pendingRoom, roomMessages, setRoomMessages, appendMessage, openCommunityChat, openChat, closeChat, setPendingRoom } = useChat();
  const [localActiveId, setLocalActiveId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveRoomId = localActiveId ?? activeRoomId;

  // Ref always holds the latest active room ID — fixes stale closure in socket handler
  const activeRoomIdRef = useRef<string | null>(null);
  useEffect(() => { activeRoomIdRef.current = effectiveRoomId; }, [effectiveRoomId]);

  // Room list
  const { data: roomsData, refetch: refetchRooms } = useQuery<{ myChatRooms: ChatRoom[] }>(
    MY_CHAT_ROOMS_QUERY,
    { skip: !isAuthenticated, fetchPolicy: 'network-only' },
  );

  // Inject pending room into list (newly created room before refetch)
  const rooms: ChatRoom[] = (() => {
    const list = roomsData?.myChatRooms ?? [];
    if (!pendingRoom) return list;
    const exists = list.some((r) => r._id === pendingRoom._id);
    return exists ? list : [pendingRoom, ...list];
  })();

  // Join ALL known rooms on socket so we receive messages even when not viewing them
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    for (const room of rooms) socket.emit('joinRoom', room._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.map((r) => r._id).join(',')]);

  // Join a newly opened room immediately (before rooms list refetches)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !effectiveRoomId) return;
    socket.emit('joinRoom', effectiveRoomId);
  }, [effectiveRoomId]);

  // Only fetch if we don't already have messages cached for this room
  const hasCached = effectiveRoomId ? (roomMessages[effectiveRoomId]?.length ?? 0) > 0 : false;

  const { data: messagesData, refetch: refetchMessages } = useQuery<{
    messages: { items: Message[]; total: number; totalPages: number };
  }>(MESSAGES_QUERY, {
    variables: { roomId: effectiveRoomId, page: 1, limit: 5 },
    skip: !effectiveRoomId || !isAuthenticated || hasCached,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!effectiveRoomId || !messagesData) return;
    const items = [...(messagesData.messages?.items ?? [])].reverse();
    setRoomMessages(effectiveRoomId, items);
  }, [messagesData, effectiveRoomId]);

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: () => {
      setText('');
    },
  });

  // Sync active room when context changes
  useEffect(() => {
    if (activeRoomId && activeRoomId !== localActiveId) {
      setLocalActiveId(activeRoomId);
    }
  }, [activeRoomId]);

  // Derive messages for the active room from context
  const localMessages = effectiveRoomId ? (roomMessages[effectiveRoomId] ?? []) : [];

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Socket.IO — connect once, use ref for active room to avoid stale closure
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = authStorage.get();
    if (!token) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';
    const socket = io(`${wsUrl}/chat`, { auth: { token }, transports: ['websocket'] });

    socket.on('message', (msg: Message) => {
      // appendMessage is stable (useCallback), no stale closure issue
      appendMessage(msg.room, msg);
      refetchRooms();
    });

    socket.on('typing', ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (roomId !== activeRoomIdRef.current || userId === user?._id) return;
      setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      setTimeout(() => setTypingUsers((prev) => prev.filter((id) => id !== userId)), 2500);
    });

    // Immediately join a newly created room (before rooms list refetches)
    const handleJoinRoom = (e: Event) => {
      const roomId = (e as CustomEvent<string>).detail;
      socket.emit('joinRoom', roomId);
    };
    window.addEventListener('chat:joinRoom', handleJoinRoom);

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
      window.removeEventListener('chat:joinRoom', handleJoinRoom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleRoomSelect = (room: ChatRoom) => {
    setLocalActiveId(room._id);
    setTypingUsers([]);
    setPendingRoom(null);
    openChat(room._id);
    // Only refetch if no cached messages for this room
    if (!roomMessages[room._id]?.length) refetchMessages();
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || !effectiveRoomId || sending) return;
    await sendMessage({ variables: { input: { roomId: effectiveRoomId, content } } });
  };

  const handleTyping = () => {
    if (!effectiveRoomId || !socketRef.current) return;
    socketRef.current.emit('typing', effectiveRoomId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  if (!isAuthenticated) return null;

  const activeRoom = rooms.find((r) => r._id === effectiveRoomId) ?? pendingRoom ?? null;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Community chat hint — only when drawer is closed */}
        {!isOpen && (
          <button
            onClick={openCommunityChat}
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 3H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a2 2 0 002-2V5a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Community Chat
          </button>
        )}

        {/* Main chat button */}
        <button
          onClick={() => isOpen ? closeChat() : openChat()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl transition hover:scale-105 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          aria-label="Open chat"
        >
          {isOpen ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Click-outside backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={closeChat} aria-hidden="true" />
      )}

      {/* Drawer */}
      <div className={`fixed bottom-0 right-0 z-50 flex h-[580px] w-full max-w-2xl flex-col overflow-hidden rounded-tl-2xl rounded-tr-2xl border border-zinc-200 bg-white shadow-2xl transition-all duration-500 dark:border-zinc-700 dark:bg-zinc-900 sm:bottom-24 sm:right-6 sm:rounded-2xl ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 pointer-events-none opacity-0'}`}>
        <div className="flex h-full">

          {/* ── Room list ── */}
          <div className="flex w-52 shrink-0 flex-col border-r border-zinc-100 dark:border-zinc-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-3 dark:border-zinc-800">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Chats</span>
              <button
                onClick={openCommunityChat}
                title="Join Community Chat"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Rooms */}
            <div className="flex-1 overflow-y-auto">
              {rooms.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">No chats yet.</p>
                  <button
                    onClick={openCommunityChat}
                    className="mt-2 text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                  >
                    Join Community
                  </button>
                </div>
              ) : (
                rooms.map((room) => {
                  const label = roomLabel(room, user!._id);
                  const ri = roomInitials(room, user!._id);
                  const isGroup = room.type === 'GROUP';
                  const isActive = room._id === effectiveRoomId;
                  return (
                    <button
                      key={room._id}
                      onClick={() => handleRoomSelect(room)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${isActive ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isGroup ? 'bg-zinc-700 dark:bg-zinc-500' : avatarColor(room._id)}`}>
                        {ri}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white">{label}</p>
                        <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                          {isGroup ? `${room.participants.length} members` : 'Private'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Message area ── */}
          <div className="flex flex-1 flex-col">
            {!effectiveRoomId || !activeRoom ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <svg className="h-8 w-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Select a chat</p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Or join the Community Chat to get started
                  </p>
                </div>
                <button
                  onClick={openCommunityChat}
                  className="mt-2 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                >
                  🌐 Join Community Chat
                </button>
              </div>
            ) : (
              <>
                {/* Room header */}
                <div className="flex items-center gap-2.5 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${activeRoom.type === 'GROUP' ? 'bg-zinc-700 dark:bg-zinc-500' : avatarColor(activeRoom._id)}`}>
                    {roomInitials(activeRoom, user!._id)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {roomLabel(activeRoom, user!._id)}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {activeRoom.type === 'GROUP'
                        ? `${activeRoom.participants.length} members`
                        : 'Private chat'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {localMessages.length === 0 ? (
                    <p className="pt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    localMessages.map((msg) => {
                      const isMe = msg.sender._id === user?._id;
                      return (
                        <div key={msg._id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {!isMe && (
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(msg.sender._id)}`}>
                              {initials(msg.sender.name)}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                            {!isMe && (
                              <span className="ml-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                {msg.sender.name}
                              </span>
                            )}
                            <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${isMe
                              ? 'rounded-br-sm bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                              : 'rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="mx-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                              {timeLabel(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-end gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-700" />
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
                        <span className="inline-flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800"
                >
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => { setText(e.target.value); handleTyping(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500 dark:focus:bg-zinc-800"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                  >
                    <svg className="h-4 w-4 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

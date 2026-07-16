import { useMutation } from '@apollo/client/react';
import { createContext, useCallback, useContext, useState } from 'react';
import {
  OPEN_COMMUNITY_CHAT_MUTATION,
  OPEN_PRIVATE_CHAT_MUTATION,
} from '@/lib/graphql/queries';

export interface ChatParticipant {
  _id: string;
  name: string;
}

export interface ChatRoom {
  _id: string;
  type: string;
  name?: string;
  participants: ChatParticipant[];
  lastMessageAt: string;
}

export interface ChatMessage {
  _id: string;
  room: string;
  sender: ChatParticipant;
  content: string;
  readBy: string[];
  createdAt: string;
}

interface ChatContextValue {
  isOpen: boolean;
  activeRoomId: string | null;
  pendingRoom: ChatRoom | null;
  // Persisted messages per room — survives navigation
  roomMessages: Record<string, ChatMessage[]>;
  setRoomMessages: (roomId: string, messages: ChatMessage[]) => void;
  appendMessage: (roomId: string, message: ChatMessage) => void;
  openChat: (roomId?: string) => void;
  closeChat: () => void;
  openCommunityChat: () => Promise<void>;
  openPrivateChatWith: (userId: string) => Promise<void>;
  setPendingRoom: (room: ChatRoom | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [pendingRoom, setPendingRoom] = useState<ChatRoom | null>(null);
  const [roomMessages, setAllRoomMessages] = useState<Record<string, ChatMessage[]>>({});

  const [openCommunity] = useMutation<{ openCommunityChat: ChatRoom }>(OPEN_COMMUNITY_CHAT_MUTATION);
  const [openPrivate] = useMutation<{ openPrivateChat: ChatRoom }>(OPEN_PRIVATE_CHAT_MUTATION);

  const setRoomMessages = useCallback((roomId: string, messages: ChatMessage[]) => {
    setAllRoomMessages((prev) => ({ ...prev, [roomId]: messages }));
  }, []);

  const appendMessage = useCallback((roomId: string, message: ChatMessage) => {
    setAllRoomMessages((prev) => {
      const existing = prev[roomId] ?? [];
      if (existing.some((m) => m._id === message._id)) return prev;
      // Keep last 5
      const updated = [...existing, message].slice(-5);
      return { ...prev, [roomId]: updated };
    });
  }, []);

  const openChat = useCallback((roomId?: string) => {
    if (roomId) setActiveRoomId(roomId);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openCommunityChat = useCallback(async () => {
    try {
      const { data } = await openCommunity();
      if (data?.openCommunityChat) {
        setPendingRoom(data.openCommunityChat);
        setActiveRoomId(data.openCommunityChat._id);
        window.dispatchEvent(new CustomEvent('chat:joinRoom', { detail: data.openCommunityChat._id }));
      }
      setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, [openCommunity]);

  const openPrivateChatWith = useCallback(async (userId: string) => {
    try {
      const { data } = await openPrivate({ variables: { userId } });
      if (data?.openPrivateChat) {
        setPendingRoom(data.openPrivateChat);
        setActiveRoomId(data.openPrivateChat._id);
        window.dispatchEvent(new CustomEvent('chat:joinRoom', { detail: data.openPrivateChat._id }));
      }
      setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, [openPrivate]);

  return (
    <ChatContext.Provider value={{
      isOpen,
      activeRoomId,
      pendingRoom,
      roomMessages,
      setRoomMessages,
      appendMessage,
      openChat,
      closeChat,
      openCommunityChat,
      openPrivateChatWith,
      setPendingRoom,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}

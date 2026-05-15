export type ChatMessageType = 'text' | 'image';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  type: ChatMessageType;
  text?: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: string;
  /** Set client-side for optimistic bubbles before the server ack. */
  pending?: boolean;
  failed?: boolean;
}

export interface ChatPeer {
  id: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
}

export interface ChatThread {
  id: string;
  listingId: string;
  listingTitle?: string;
  listingImage?: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string | null;
  buyerUnread: number;
  sellerUnread: number;
  /** Convenience: which side the *current user* is — buyer or seller. */
  peer?: ChatPeer | null;
  /** Convenience: this user's unread count for the thread. */
  unread?: number;
  createdAt?: string;
  updatedAt?: string;
}

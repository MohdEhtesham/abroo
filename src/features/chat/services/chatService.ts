import { apiGet, apiPost } from '../../../services/apiClient';
import type { ChatMessage, ChatThread } from '../types';

// =============================================================================
// REST surface
// =============================================================================
//
// Real-time delivery is layered on top via the /chat Socket.IO namespace —
// see useChatSocket() in the components dir. REST is the authority for
// history + initial loads + sends; the socket is a push optimisation.

export const chatService = {
  /** All threads the current user is a member of, newest first. */
  listThreads: () => apiGet<ChatThread[]>('/chat/threads'),

  /** Find-or-create a thread for `listingId`. Buyer flow needs only the
   *  listingId; seller flow must also supply the buyerId. */
  openThread: (listingId: string, buyerId?: string) =>
    apiPost<ChatThread>('/chat/threads', { listingId, buyerId }),

  /** Thread metadata + a page of messages (newest 50 by default). */
  getThread: (threadId: string, before?: string) => {
    const qs = before ? `?before=${encodeURIComponent(before)}` : '';
    return apiGet<{
      thread: ChatThread;
      messages: ChatMessage[];
      hasMore: boolean;
    }>(`/chat/threads/${threadId}${qs}`);
  },

  sendText: (threadId: string, text: string) =>
    apiPost<ChatMessage>(`/chat/threads/${threadId}/messages`, { type: 'text', text }),

  sendImage: (threadId: string, imageUrl: string) =>
    apiPost<ChatMessage>(`/chat/threads/${threadId}/messages`, { type: 'image', imageUrl }),

  markRead: (threadId: string) =>
    apiPost<{ success: boolean }>(`/chat/threads/${threadId}/read`),
};

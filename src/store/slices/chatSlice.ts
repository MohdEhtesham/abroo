import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { chatService } from '../../features/chat/services/chatService';
import type { ChatMessage, ChatThread } from '../../features/chat/types';
import { getErrorMessage } from '../../utils/apiError';

interface ChatState {
  /** All threads the user has, newest first. */
  threads: ChatThread[];
  /** threadId → ordered (asc by createdAt) message list. */
  messagesByThread: Record<string, ChatMessage[]>;
  /** Whether the threads list has been loaded at least once. */
  threadsLoaded: boolean;
  loading: boolean;
  sending: boolean;
  error: string | null;
}

const initialState: ChatState = {
  threads: [],
  messagesByThread: {},
  threadsLoaded: false,
  loading: false,
  sending: false,
  error: null,
};

// =============================================================================
// Thunks
// =============================================================================

export const loadThreadsThunk = createAsyncThunk(
  'chat/loadThreads',
  async (_, { rejectWithValue }) => {
    try {
      return await chatService.listThreads();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not load chats.'));
    }
  },
);

export const openThreadThunk = createAsyncThunk(
  'chat/openThread',
  async (
    input: string | { listingId: string; buyerId?: string },
    { rejectWithValue },
  ) => {
    const args = typeof input === 'string' ? { listingId: input } : input;
    try {
      return await chatService.openThread(args.listingId, args.buyerId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not open chat.'));
    }
  },
);

export const loadThreadThunk = createAsyncThunk(
  'chat/loadThread',
  async (threadId: string, { rejectWithValue }) => {
    try {
      return await chatService.getThread(threadId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Could not load this conversation.'));
    }
  },
);

export const sendTextThunk = createAsyncThunk(
  'chat/sendText',
  async (input: { threadId: string; text: string; tempId: string }, { rejectWithValue }) => {
    try {
      const msg = await chatService.sendText(input.threadId, input.text);
      return { ...input, msg };
    } catch (e) {
      return rejectWithValue({ ...input, error: getErrorMessage(e, 'Could not send message.') });
    }
  },
);

export const markReadThunk = createAsyncThunk(
  'chat/markRead',
  async (threadId: string) => {
    await chatService.markRead(threadId);
    return threadId;
  },
);

// =============================================================================
// Reducers — utility
// =============================================================================

const insertMessageSorted = (list: ChatMessage[], msg: ChatMessage) => {
  // Dedupe by id (covers the optimistic→real swap) then keep ordered.
  const filtered = list.filter(m => m.id !== msg.id);
  filtered.push(msg);
  filtered.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  return filtered;
};

const bumpThreadOnNewMessage = (
  threads: ChatThread[],
  threadId: string,
  msg: ChatMessage,
  myUserId: string | null,
) => {
  const idx = threads.findIndex(t => t.id === threadId);
  if (idx === -1) return threads;
  const t = threads[idx];
  const isMine = myUserId && msg.senderId === myUserId;
  const updated: ChatThread = {
    ...t,
    lastMessage: msg.type === 'text' ? msg.text : '📷 Photo',
    lastMessageAt: msg.createdAt,
    lastSenderId: msg.senderId,
    unread: isMine ? t.unread ?? 0 : (t.unread ?? 0) + 1,
  };
  const rest = threads.filter((_, i) => i !== idx);
  return [updated, ...rest];
};

// =============================================================================
// Slice
// =============================================================================

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /** Push an optimistic outgoing message into the thread before the
     *  server ack — the bubble appears instantly, the real id swaps in
     *  when sendTextThunk.fulfilled fires. */
    addOptimisticMessage: (
      state,
      action: PayloadAction<{ threadId: string; message: ChatMessage }>,
    ) => {
      const { threadId, message } = action.payload;
      const list = state.messagesByThread[threadId] ?? [];
      state.messagesByThread[threadId] = insertMessageSorted(list, message);
    },

    /** Socket push: a message arrived from the other side. */
    socketMessageReceived: (
      state,
      action: PayloadAction<{ message: ChatMessage; myUserId: string | null }>,
    ) => {
      const { message, myUserId } = action.payload;
      const list = state.messagesByThread[message.threadId] ?? [];
      state.messagesByThread[message.threadId] = insertMessageSorted(list, message);
      state.threads = bumpThreadOnNewMessage(state.threads, message.threadId, message, myUserId);
    },

    /** Socket push from `thread-touched` when a peer messages in a thread
     *  we don't currently have loaded — refresh threads next time the user
     *  opens the list. Keeps unread badge fresh in the meantime. */
    socketThreadTouched: (
      state,
      action: PayloadAction<{ threadId: string; message: ChatMessage; myUserId: string | null }>,
    ) => {
      const { threadId, message, myUserId } = action.payload;
      state.threads = bumpThreadOnNewMessage(state.threads, threadId, message, myUserId);
    },

    clearLocalUnread: (state, action: PayloadAction<string>) => {
      const idx = state.threads.findIndex(t => t.id === action.payload);
      if (idx !== -1) state.threads[idx].unread = 0;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadThreadsThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadThreadsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.threadsLoaded = true;
        state.threads = action.payload;
      })
      .addCase(loadThreadsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(openThreadThunk.fulfilled, (state, action) => {
        const thread = action.payload;
        // Add at the top if not already present.
        if (!state.threads.some(t => t.id === thread.id)) {
          state.threads = [thread, ...state.threads];
        }
      })
      .addCase(loadThreadThunk.fulfilled, (state, action) => {
        const { thread, messages } = action.payload;
        state.messagesByThread[thread.id] = messages;
        const idx = state.threads.findIndex(t => t.id === thread.id);
        if (idx >= 0) state.threads[idx] = { ...state.threads[idx], ...thread };
        else state.threads = [thread, ...state.threads];
      })
      .addCase(sendTextThunk.pending, state => {
        state.sending = true;
      })
      .addCase(sendTextThunk.fulfilled, (state, action) => {
        state.sending = false;
        const { threadId, tempId, msg } = action.payload;
        const list = state.messagesByThread[threadId] ?? [];
        // Swap optimistic tempId for the real persisted message.
        const cleaned = list.filter(m => m.id !== tempId);
        state.messagesByThread[threadId] = insertMessageSorted(cleaned, msg);
        // Bump thread preview locally so the threads list reflects it
        // even before the next refresh.
        state.threads = bumpThreadOnNewMessage(state.threads, threadId, msg, msg.senderId);
      })
      .addCase(sendTextThunk.rejected, (state, action) => {
        state.sending = false;
        const payload = action.payload as { threadId: string; tempId: string; error: string } | undefined;
        if (payload) {
          const list = state.messagesByThread[payload.threadId] ?? [];
          state.messagesByThread[payload.threadId] = list.map(m =>
            m.id === payload.tempId ? { ...m, pending: false, failed: true } : m,
          );
          state.error = payload.error;
        }
      })
      .addCase(markReadThunk.fulfilled, (state, action) => {
        const idx = state.threads.findIndex(t => t.id === action.payload);
        if (idx !== -1) state.threads[idx].unread = 0;
      });
  },
});

export const {
  addOptimisticMessage,
  socketMessageReceived,
  socketThreadTouched,
  clearLocalUnread,
} = chatSlice.actions;
export default chatSlice.reducer;

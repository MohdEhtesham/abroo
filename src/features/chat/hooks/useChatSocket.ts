import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../config/env';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  socketMessageReceived,
  socketThreadTouched,
} from '../../../store/slices/chatSlice';
import type { ChatMessage } from '../types';

/**
 * Maintain a single chat socket connection for the authenticated session.
 *
 * The socket lives at the app root via <ChatSocketBridge /> so it's
 * connected the whole time the user is signed in — incoming messages push
 * into the Redux store regardless of which screen they're on, keeping
 * unread badges and the threads list live everywhere.
 *
 * Per-thread joining/leaving is done inside ChatScreen so the server only
 * fans out the high-frequency `message` events to subscribers actively
 * viewing the conversation.
 */
export const useChatSocket = (): Socket | null => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(s => s.auth.token);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const myUserId = useAppSelector(s => s.auth.user?.id ?? null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      try { socketRef.current?.disconnect(); } catch {}
      socketRef.current = null;
      return;
    }

    const socket = io(`${API_BASE_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 15000,
    });
    socketRef.current = socket;

    socket.on('message', (message: ChatMessage) => {
      dispatch(socketMessageReceived({ message, myUserId }));
    });

    socket.on('thread-touched', ({ threadId, message }: { threadId: string; message: ChatMessage }) => {
      dispatch(socketThreadTouched({ threadId, message, myUserId }));
    });

    return () => {
      try { socket.disconnect(); } catch {}
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [dispatch, isAuthenticated, token, myUserId]);

  return socketRef.current;
};

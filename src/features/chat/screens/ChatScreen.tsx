import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import { Avatar, Screen, Text } from '../../../components';
import { API_BASE_URL } from '../../../config/env';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  addOptimisticMessage,
  loadThreadThunk,
  markReadThunk,
  sendTextThunk,
} from '../../../store/slices/chatSlice';
import { useTheme } from '../../../theme';
import { formatTime } from '../../../utils/format';
import type { ChatMessage } from '../types';

type ChatRouteParams = { Chat: { threadId: string } };

export const ChatScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const dispatch = useAppDispatch();
  const threadId = route.params?.threadId;

  const thread = useAppSelector(s => s.chat.threads.find(t => t.id === threadId));
  const messages = useAppSelector(s => s.chat.messagesByThread[threadId] ?? []);
  const sending = useAppSelector(s => s.chat.sending);
  const myUserId = useAppSelector(s => s.auth.user?.id ?? '');
  const token = useAppSelector(s => s.auth.token);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  // Per-screen socket connection so we can `join` this thread's room — the
  // app-wide ChatSocketBridge handles the global push channel separately.
  const socketRef = useRef<Socket | null>(null);

  // Load the thread (metadata + a page of messages) and mark it read.
  useEffect(() => {
    if (!threadId) return;
    dispatch(loadThreadThunk(threadId));
    dispatch(markReadThunk(threadId));
  }, [dispatch, threadId]);

  // Join the thread's room so the server fans out new messages from the
  // peer instantly. The app-wide bridge already wires socketMessageReceived
  // into the slice, so we don't need an extra listener here.
  useEffect(() => {
    if (!threadId || !token) return;
    const socket = io(`${API_BASE_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      timeout: 15000,
    });
    socketRef.current = socket;
    socket.emit('join', { threadId });

    return () => {
      try { socket.emit('leave', { threadId }); } catch {}
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [threadId, token]);

  // Auto-scroll to the latest message whenever the list changes.
  useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const send = useCallback(() => {
    const t = text.trim();
    if (!t || !threadId) return;
    setText('');

    // Optimistic bubble — appears immediately, swaps to the real id when
    // sendTextThunk.fulfilled lands.
    const tempId = `tmp_${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      threadId,
      senderId: myUserId,
      type: 'text',
      text: t,
      readBy: [],
      createdAt: new Date().toISOString(),
      pending: true,
    };
    dispatch(addOptimisticMessage({ threadId, message: optimistic }));
    dispatch(sendTextThunk({ threadId, text: t, tempId }));
  }, [dispatch, myUserId, text, threadId]);

  const peer = thread?.peer ?? null;
  const peerName = peer?.fullName ?? 'Conversation';

  // Group messages by date so we can show a subtle date pill between days.
  const dateLabel = useMemo(() => {
    const labels: Record<string, string> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    for (const m of messages) {
      const d = new Date(m.createdAt).toDateString();
      if (labels[d]) continue;
      if (d === today) labels[d] = 'Today';
      else if (d === yesterday) labels[d] = 'Yesterday';
      else
        labels[d] = new Date(m.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
    }
    return labels;
  }, [messages]);

  return (
    <Screen edges={['top', 'bottom']}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.iconBtn, { backgroundColor: theme.colors.divider }]}
        >
          <Icon name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 10 }}>
          <Avatar name={peerName} uri={peer?.avatar} size={40} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text variant="bodyLg" weight="700" numberOfLines={1}>
              {peerName}
            </Text>
            {!!thread?.listingTitle && (
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                Re: {thread.listingTitle}
              </Text>
            )}
          </View>
        </View>
        {peer?.phone ? (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: theme.colors.divider }]}
            onPress={() => Linking.openURL(`tel:${peer.phone}`)}
          >
            <Icon name="call-outline" size={20} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 }}
          renderItem={({ item, index }) => {
            const mine = item.senderId === myUserId;
            const prev = index > 0 ? messages[index - 1] : null;
            const currentDay = new Date(item.createdAt).toDateString();
            const showDate = !prev || new Date(prev.createdAt).toDateString() !== currentDay;
            return (
              <>
                {showDate && (
                  <View style={styles.dateRow}>
                    <View
                      style={[
                        styles.datePill,
                        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                      ]}
                    >
                      <Text variant="caption" weight="700" color="textMuted">
                        {dateLabel[currentDay]}
                      </Text>
                    </View>
                  </View>
                )}
                <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : null]}>
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 }
                        : {
                            backgroundColor: theme.colors.surfaceElevated,
                            borderBottomLeftRadius: 4,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Text style={{ color: mine ? '#fff' : theme.colors.text, fontSize: 15, lineHeight: 20 }}>
                      {item.text}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text
                        variant="caption"
                        style={{
                          color: mine ? 'rgba(255,255,255,0.78)' : theme.colors.textMuted,
                          fontSize: 10,
                        }}
                      >
                        {formatTime(item.createdAt)}
                      </Text>
                      {mine && item.pending && (
                        <Icon
                          name="time-outline"
                          size={11}
                          color="rgba(255,255,255,0.78)"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                      {mine && item.failed && (
                        <Icon name="alert-circle" size={12} color="#fca5a5" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </View>
                </View>
              </>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="chatbubbles-outline" size={36} color={theme.colors.textMuted} />
              <Text variant="bodySm" color="textMuted" align="center" style={{ marginTop: 10 }}>
                Say hello to {peerName.split(' ')[0]} — your messages stay private to this listing.
              </Text>
            </View>
          }
        />

        <View
          style={[
            styles.inputBar,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.divider },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
            ]}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: 15,
                paddingVertical: 0,
                maxHeight: 100,
              }}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={[
              styles.sendBtn,
              {
                backgroundColor: text.trim() ? theme.colors.primary : theme.colors.divider,
                opacity: text.trim() ? 1 : 0.7,
              },
            ]}
          >
            <Icon name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  dateRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
});

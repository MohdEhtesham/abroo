import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Avatar,
  EmptyState,
  Screen,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loadThreadsThunk } from '../../../store/slices/chatSlice';
import { useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';

export const ChatThreadsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const threads = useAppSelector(s => s.chat.threads);
  const loading = useAppSelector(s => s.chat.loading);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadThreadsThunk());
    }, [dispatch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadThreadsThunk());
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(t => {
      const peer = t.peer?.fullName?.toLowerCase() ?? '';
      const listing = t.listingTitle?.toLowerCase() ?? '';
      const preview = t.lastMessage?.toLowerCase() ?? '';
      return peer.includes(q) || listing.includes(q) || preview.includes(q);
    });
  }, [threads, query]);

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title="Chats"
        showBack={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View
          style={[
            styles.searchRow,
            { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="search" size={16} color={theme.colors.textMuted} />
          <TextInput
            placeholder="Search by name or listing"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, marginLeft: 8, color: theme.colors.text, fontSize: 14 }}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle" size={16} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        ItemSeparatorComponent={() => (
          <View style={[styles.sep, { backgroundColor: theme.colors.divider }]} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        renderItem={({ item }) => {
          const peerName = item.peer?.fullName ?? 'Conversation';
          const preview = item.lastMessage ?? 'Start the conversation';
          const unread = item.unread ?? 0;
          return (
            <Pressable
              onPress={() => navigation.navigate('Chat', { threadId: item.id })}
              android_ripple={{ color: theme.colors.primary + '14' }}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? theme.colors.primary + '06' : 'transparent',
                },
              ]}
            >
              <Avatar name={peerName} uri={item.peer?.avatar} size={50} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.topLine}>
                  <Text variant="bodyLg" weight={unread > 0 ? '800' : '700'} numberOfLines={1} style={{ flex: 1 }}>
                    {peerName}
                  </Text>
                  {!!item.lastMessageAt && (
                    <Text variant="caption" color="textMuted" style={{ marginLeft: 8 }}>
                      {timeAgo(item.lastMessageAt)}
                    </Text>
                  )}
                </View>
                {!!item.listingTitle && (
                  <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 1 }}>
                    {item.listingTitle}
                  </Text>
                )}
                <View style={styles.previewLine}>
                  <Text
                    variant="bodySm"
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: unread > 0 ? theme.colors.text : theme.colors.textMuted,
                      fontWeight: unread > 0 ? '600' : '400',
                    }}
                  >
                    {preview}
                  </Text>
                  {unread > 0 && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]}>
                      <Text variant="caption" weight="800" style={{ color: '#fff', fontSize: 11 }}>
                        {unread > 9 ? '9+' : unread}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {!!item.listingImage && (
                <Image source={{ uri: item.listingImage }} style={styles.listingThumb} />
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              iconName="chatbubbles-outline"
              title="No chats yet"
              message="Inquire on a property or open chat from a listing — your conversations will appear here."
            />
          ) : null
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 82,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listingThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
});

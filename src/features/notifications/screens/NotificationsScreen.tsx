import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  EmptyState,
  Screen,
  SkeletonLoader,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  loadNotificationsThunk,
  markAllReadThunk,
  markReadThunk,
} from '../../../store/slices/notificationSlice';
import { useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';
import type { AppNotification, NotificationType } from '../types';

const iconForType: Record<NotificationType, { name: string; color: 'primary' | 'success' | 'warning' | 'accent' | 'info' }> = {
  inquiry_update: { name: 'document-text-outline', color: 'primary' },
  visit_reminder: { name: 'calendar-outline', color: 'success' },
  new_property: { name: 'sparkles-outline', color: 'accent' },
  price_drop: { name: 'trending-down-outline', color: 'warning' },
  message: { name: 'chatbubble-outline', color: 'info' },
  system: { name: 'information-circle-outline', color: 'info' },
};

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector(s => s.notification);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadNotificationsThunk());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadNotificationsThunk());
    setRefreshing(false);
  };

  const onPress = (n: AppNotification) => {
    if (!n.read) dispatch(markReadThunk(n.id));
    if (n.type === 'inquiry_update') {
      navigation.navigate('InquiriesStack', { screen: 'InquiryDetail', params: { id: n.actionId } });
    } else if (n.type === 'visit_reminder') {
      navigation.navigate('VisitsStack', { screen: 'UpcomingVisits' });
    } else if (n.type === 'new_property' || n.type === 'price_drop') {
      navigation.navigate('PropertyStack', { screen: 'PropertyDetail', params: { id: n.actionId } });
    } else if (n.type === 'message') {
      navigation.navigate('ChatStack', { screen: 'Chat' });
    }
  };

  const tones: Record<string, string> = {
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    accent: theme.colors.accent,
    info: theme.colors.info,
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title="Notifications"
        onBackPress={() => navigation.goBack()}
        rightLabel="Mark all"
        onRightPress={() => dispatch(markAllReadThunk())}
      />
      {loading && list.length === 0 ? (
        <View style={{ padding: 20 }}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} height={70} borderRadius={12} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={n => n.id}
          contentContainerStyle={{ paddingVertical: 6 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => {
            const cfg = iconForType[item.type];
            const tint = tones[cfg.color];
            return (
              <Pressable
                onPress={() => onPress(item)}
                style={[
                  styles.row,
                  {
                    backgroundColor: item.read ? 'transparent' : theme.colors.primary + '08',
                    borderBottomColor: theme.colors.divider,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: tint + '18' }]}>
                  <Icon name={cfg.name as any} size={22} color={tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="bodyLg" weight={item.read ? '600' : '700'} style={{ flex: 1 }}>
                      {item.title}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <Text variant="bodySm" color="textSecondary" style={{ marginTop: 2 }} numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>
                {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                iconName="notifications-off-outline"
                title="No notifications"
                message="You're all caught up. We'll let you know when something new happens."
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});

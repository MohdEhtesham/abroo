import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  AnimatedHeader,
  EmptyState,
  FadeSlideIn,
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
  const role = useAppSelector(s => s.auth.user?.role ?? 'consumer');
  const isSeller = role === 'seller';

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
    // The consumer-only stacks (InquiriesStack/VisitsStack/PropertyStack) live
    // inside the root "Main" navigator and don't exist in the seller tab tree,
    // so we route sellers to their equivalent surfaces (LeadsTab) instead.
    if (n.type === 'inquiry_update') {
      if (isSeller) {
        navigation.navigate('Main', { screen: 'LeadsTab', params: { screen: 'Leads' } });
      } else {
        navigation.navigate('Main', {
          screen: 'InquiriesStack',
          params: n.actionId
            ? { screen: 'InquiryDetail', params: { id: n.actionId } }
            : { screen: 'MyInquiries' },
        });
      }
    } else if (n.type === 'visit_reminder') {
      if (isSeller) {
        // Sellers get a richer visit-management screen reachable from the
        // SellerHome tab (registered there + on the Leads tab navigator).
        navigation.navigate('Main', {
          screen: 'SellerHomeTab',
          params: { screen: 'SellerVisits', params: { initialTab: 'upcoming' } },
        });
      } else {
        navigation.navigate('Main', {
          screen: 'VisitsStack',
          params: { screen: 'UpcomingVisits' },
        });
      }
    } else if (n.type === 'new_property' || n.type === 'price_drop') {
      if (!n.actionId) return;
      navigation.navigate('Main', {
        screen: 'PropertyStack',
        params: { screen: 'PropertyDetail', params: { id: n.actionId } },
      });
    } else if (n.type === 'message') {
      // For sellers, "New lead received" → take them to the Leads tab.
      if (isSeller) {
        navigation.navigate('Main', { screen: 'LeadsTab', params: { screen: 'Leads' } });
      } else {
        navigation.navigate('ChatStack', { screen: 'Chat' });
      }
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item, index }) => {
            const cfg = iconForType[item.type];
            const tint = tones[cfg.color];
            return (
              <FadeSlideIn delay={index * 35}>
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
                  {!item.read && <PulsingDot color={theme.colors.primary} />}
                </Pressable>
              </FadeSlideIn>
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

const PulsingDot: React.FC<{ color: string }> = ({ color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.unreadDot,
        { backgroundColor: color },
        style,
      ]}
    />
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

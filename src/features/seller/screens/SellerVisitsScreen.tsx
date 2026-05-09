import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Avatar,
  Card,
  EmptyState,
  Screen,
  SkeletonLoader,
  StatusBadge,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  loadSellerVisitsThunk,
  setSellerVisitStatusThunk,
} from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';
import { formatDate, timeAgo } from '../../../utils/format';
import type { SellerVisit, SellerVisitStatus } from '../types';

type FilterTab = 'upcoming' | 'completed' | 'cancelled' | 'all';

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

const statusMeta = (
  s: SellerVisitStatus,
): { label: string; tone: 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'accent' } => {
  switch (s) {
    case 'upcoming':
      return { label: 'Upcoming', tone: 'info' };
    case 'completed':
      return { label: 'Completed', tone: 'success' };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'error' };
    case 'rescheduled':
      return { label: 'Rescheduled', tone: 'warning' };
  }
};

type RouteProps = RouteProp<{ SellerVisits: { initialTab?: FilterTab } | undefined }, 'SellerVisits'>;

export const SellerVisitsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const dispatch = useAppDispatch();
  const { visits } = useAppSelector(s => s.seller);
  const [tab, setTab] = useState<FilterTab>(route.params?.initialTab ?? 'upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    dispatch(loadSellerVisitsThunk()).finally(() => {
      if (!cancelled) setInitialLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(loadSellerVisitsThunk());
    setRefreshing(false);
  }, [dispatch]);

  const filtered = useMemo(() => {
    if (tab === 'all') return visits;
    return visits.filter(v => v.status === tab);
  }, [visits, tab]);

  const counts = useMemo(
    () => ({
      upcoming: visits.filter(v => v.status === 'upcoming').length,
      completed: visits.filter(v => v.status === 'completed').length,
      cancelled: visits.filter(v => v.status === 'cancelled').length,
    }),
    [visits],
  );

  const onCancel = (v: SellerVisit) => {
    Alert.alert('Cancel this visit?', 'The buyer will be notified.', [
      { text: 'Keep visit', style: 'cancel' },
      {
        text: 'Cancel visit',
        style: 'destructive',
        onPress: () => {
          dispatch(setSellerVisitStatusThunk({ id: v.id, status: 'cancelled' }));
        },
      },
    ]);
  };

  const onMarkCompleted = (v: SellerVisit) => {
    dispatch(setSellerVisitStatusThunk({ id: v.id, status: 'completed' }));
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title="Site Visits"
        showBack={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Card padding={14}>
          <View style={styles.statsRow}>
            <Stat label="Upcoming" value={counts.upcoming} color={theme.colors.info} />
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <Stat label="Completed" value={counts.completed} color={theme.colors.success} />
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <Stat label="Cancelled" value={counts.cancelled} color={theme.colors.error} />
          </View>
        </Card>
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text variant="bodySm" weight="700" style={{ color: active ? '#fff' : theme.colors.text }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {initialLoading && visits.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} height={180} borderRadius={16} style={{ marginBottom: 14 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={v => v.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 }}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={9}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => (
            <VisitCard
              visit={item}
              onCancel={() => onCancel(item)}
              onMarkCompleted={() => onMarkCompleted(item)}
            />
          )}
          ListEmptyComponent={
            !initialLoading ? (
              <EmptyState
                iconName="calendar-outline"
                title={
                  tab === 'upcoming'
                    ? 'No upcoming visits'
                    : tab === 'completed'
                    ? 'No completed visits yet'
                    : tab === 'cancelled'
                    ? 'No cancelled visits'
                    : 'No site visits yet'
                }
                message="When buyers schedule visits on your listings, you'll see them here with their contact details."
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text variant="h3" weight="800" style={{ color }}>
      {value}
    </Text>
    <Text variant="caption" color="textMuted">
      {label}
    </Text>
  </View>
);

interface VisitCardProps {
  visit: SellerVisit;
  onCancel: () => void;
  onMarkCompleted: () => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, onCancel, onMarkCompleted }) => {
  const theme = useTheme();
  const meta = statusMeta(visit.status);
  const buyerName = visit.buyer?.fullName ?? 'Buyer';
  const buyerPhone = visit.buyer?.phone ?? '';
  const isVirtual = visit.mode === 'virtual';
  const dateLabel = formatDate(visit.date);
  const isActionable = visit.status === 'upcoming';

  const onCall = () => {
    if (!buyerPhone) {
      Alert.alert('No phone number on file', 'This buyer has not shared a phone number.');
      return;
    }
    Linking.openURL(`tel:${buyerPhone}`);
  };

  const onWhatsApp = () => {
    if (!buyerPhone) {
      Alert.alert('No phone number on file', 'This buyer has not shared a phone number.');
      return;
    }
    const firstName = buyerName.split(' ')[0];
    const msg = `Hi ${firstName}, regarding your site visit for "${visit.propertyTitle}" on ${dateLabel}, ${visit.timeSlot}.`;
    Linking.openURL(`https://wa.me/91${buyerPhone}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Card padding={14} style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={buyerName} uri={visit.buyer?.avatar} size={44} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text variant="bodyLg" weight="700" numberOfLines={1}>
            {buyerName}
          </Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: 1 }}>
            Booked {timeAgo(visit.createdAt)}
          </Text>
        </View>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </View>

      <View style={[styles.listingRow, { backgroundColor: theme.colors.divider + '40' }]}>
        {visit.propertyImage ? (
          <Image source={{ uri: visit.propertyImage }} style={styles.listingImage} />
        ) : (
          <View style={[styles.listingImage, { backgroundColor: theme.colors.divider }]} />
        )}
        <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
          <Text variant="caption" color="textMuted">
            Visit booked for
          </Text>
          <Text variant="bodySm" weight="700" numberOfLines={1}>
            {visit.propertyTitle}
          </Text>
          {!!visit.propertyLocation && (
            <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 1 }}>
              {visit.propertyLocation}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.factsRow, { borderTopColor: theme.colors.divider }]}>
        <Fact icon="calendar-outline" label="Date" value={dateLabel} />
        <View style={[styles.factDivider, { backgroundColor: theme.colors.divider }]} />
        <Fact icon="time-outline" label="Slot" value={visit.timeSlot} />
        <View style={[styles.factDivider, { backgroundColor: theme.colors.divider }]} />
        <Fact
          icon={isVirtual ? 'videocam-outline' : 'home-outline'}
          label="Mode"
          value={isVirtual ? 'Virtual' : 'In-person'}
        />
      </View>

      {!!visit.notes && (
        <View
          style={[
            styles.notes,
            { backgroundColor: theme.colors.primary + '10', borderLeftColor: theme.colors.primary },
          ]}
        >
          <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
            Buyer's note
          </Text>
          <Text variant="bodySm" color="textSecondary" style={{ marginTop: 2, lineHeight: 19 }}>
            {visit.notes}
          </Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onCall}
          style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Icon name="call" size={14} color="#fff" />
          <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 5 }}>
            Call
          </Text>
        </Pressable>
        <Pressable
          onPress={onWhatsApp}
          style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
        >
          <Icon name="logo-whatsapp" size={14} color="#fff" />
          <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 5 }}>
            WhatsApp
          </Text>
        </Pressable>
        {isActionable && (
          <>
            <Pressable
              onPress={onMarkCompleted}
              style={[styles.actionBtn, { backgroundColor: theme.colors.success + '20' }]}
            >
              <Icon name="checkmark" size={14} color={theme.colors.success} />
              <Text
                variant="caption"
                weight="700"
                style={{ color: theme.colors.success, marginLeft: 4 }}
              >
                Done
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={[styles.actionBtn, { backgroundColor: theme.colors.error + '15' }]}
            >
              <Icon name="close" size={14} color={theme.colors.error} />
            </Pressable>
          </>
        )}
      </View>
    </Card>
  );
};

const Fact: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => {
  const theme = useTheme();
  return (
    <View style={styles.fact}>
      <Icon name={icon as any} size={14} color={theme.colors.primary} />
      <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
        {label}
      </Text>
      <Text variant="caption" weight="700" numberOfLines={1} style={{ marginTop: 1 }}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    borderRadius: 10,
  },
  listingImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  factsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fact: {
    flex: 1,
    alignItems: 'center',
  },
  factDivider: {
    width: 1,
    marginVertical: 4,
  },
  notes: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
});

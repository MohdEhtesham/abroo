import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  EmptyState,
  Screen,
  SkeletonLoader,
  StatusBadge,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { decrementListingQuota } from '../../../store/slices/authSlice';
import {
  deleteListingThunk,
  loadListingsThunk,
  setListingStatusThunk,
} from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';
import { formatCurrency, timeAgo } from '../../../utils/format';
import { safeArray } from '../../../utils/safe';
import type { ListingStatus } from '../types';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=70';

const safeNum = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

const TABS: Array<{ id: 'all' | ListingStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'paused', label: 'Paused' },
  { id: 'sold', label: 'Sold' },
];

const statusTone = (s: ListingStatus): 'success' | 'warning' | 'info' | 'neutral' | 'accent' => {
  switch (s) {
    case 'live':
      return 'success';
    case 'draft':
      return 'neutral';
    case 'paused':
      return 'warning';
    case 'sold':
      return 'accent';
    case 'review':
      return 'info';
  }
};

export const MyListingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { listings, loading } = useAppSelector(s => s.seller);
  const seller = useAppSelector(s => s.auth.user?.seller);
  const [tab, setTab] = useState<'all' | ListingStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadListingsThunk());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadListingsThunk());
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (tab === 'all') return listings;
    return listings.filter(l => l.status === tab);
  }, [listings, tab]);

  const onAction = async (id: string, status: ListingStatus, currentStatus: ListingStatus) => {
    const next: ListingStatus = currentStatus === 'live' ? 'paused' : 'live';
    const action = await dispatch(setListingStatusThunk({ id, status: next }));
    if (setListingStatusThunk.rejected.match(action)) {
      Alert.alert(
        'Could not update listing',
        (action.payload as string | undefined) ?? 'Please try again.',
      );
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const action = await dispatch(deleteListingThunk(id));
          if (deleteListingThunk.fulfilled.match(action)) {
            dispatch(decrementListingQuota());
          } else {
            Alert.alert(
              'Could not delete listing',
              (action.payload as string | undefined) ?? 'Please try again.',
            );
          }
        },
      },
    ]);
  };

  const used = seller?.listingQuotaUsed ?? 0;
  const total = seller?.listingQuotaTotal ?? 0;

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title="My Listings"
        showBack={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
      />

      {seller && (
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quotaCard}
          >
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>
                {(seller.plan ?? 'free').toUpperCase()} PLAN
              </Text>
              <Text variant="h3" weight="800" style={{ color: '#fff', marginTop: 4 }}>
                {used} / {total === 999 ? '∞' : total} listings used
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                {safeNum(seller.totalLeads)} total leads received
              </Text>
            </View>
            {seller.plan !== 'pro' && (
              <Pressable
                style={[styles.upgradeBtn, { backgroundColor: theme.colors.accent }]}
                onPress={() => navigation.navigate('Plans')}
              >
                <Icon name="rocket-outline" size={14} color="#fff" />
                <Text weight="700" style={{ color: '#fff', marginLeft: 6, fontSize: 13 }}>
                  Upgrade
                </Text>
              </Pressable>
            )}
          </LinearGradient>
        </View>
      )}

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

      {loading && listings.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} height={140} borderRadius={16} style={{ marginBottom: 14 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={9}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => {
            const images = safeArray(item.images);
            const cover = images[0] || PLACEHOLDER_IMAGE;
            const status = (item.status ?? 'live') as ListingStatus;
            const locationLine = [item.locality, item.city].filter(Boolean).join(', ') || '—';
            return (
            <Card padding={14} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row' }}>
                <Image source={{ uri: cover }} style={styles.image} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyLg" weight="700" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                      {item.title ?? 'Untitled'}
                    </Text>
                    <StatusBadge label={status} tone={statusTone(status)} />
                  </View>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 2 }} numberOfLines={1}>
                    {locationLine}
                  </Text>
                  <Text variant="bodyLg" weight="700" style={{ color: theme.colors.primary, marginTop: 6 }}>
                    {formatCurrency(safeNum(item.priceMin))}
                  </Text>
                </View>
              </View>
              <View style={[styles.metricsRow, { borderTopColor: theme.colors.divider }]}>
                <Metric icon="eye-outline" value={safeNum(item.views)} label="Views" />
                <View style={[styles.metricDivider, { backgroundColor: theme.colors.divider }]} />
                <Metric icon="document-text-outline" value={safeNum(item.inquiries)} label="Inquiries" />
                <View style={[styles.metricDivider, { backgroundColor: theme.colors.divider }]} />
                <Metric icon="heart-outline" value={safeNum(item.saves)} label="Saves" />
              </View>
              <View style={styles.actionsRow}>
                <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                  Updated {item.updatedAt ? timeAgo(item.updatedAt) : 'just now'}
                </Text>
                {status !== 'sold' && (
                  <Pressable
                    onPress={() => onAction(item.id, status, status)}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '14' }]}
                  >
                    <Icon
                      name={status === 'live' ? 'pause' : 'play'}
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text variant="caption" weight="700" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                      {status === 'live' ? 'Pause' : 'Activate'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => onDelete(item.id)}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.error + '14' }]}
                >
                  <Icon name="trash-outline" size={14} color={theme.colors.error} />
                </Pressable>
              </View>
            </Card>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                iconName="business-outline"
                title="No listings yet"
                message="Post your first property and start receiving leads from genuine buyers."
                actionLabel="Post Property"
                onActionPress={() => navigation.navigate('AddListing')}
              />
            ) : null
          }
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddListing')}
      >
        <Icon name="add" size={26} color="#fff" />
      </Pressable>
    </Screen>
  );
};

const Metric: React.FC<{ icon: string; value: number; label: string }> = ({ icon, value, label }) => {
  const theme = useTheme();
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return (
    <View style={styles.metric}>
      <Icon name={icon as any} size={14} color={theme.colors.primary} />
      <Text variant="caption" weight="700" style={{ marginTop: 2 }}>
        {safe.toLocaleString('en-IN')}
      </Text>
      <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  quotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    marginVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
});

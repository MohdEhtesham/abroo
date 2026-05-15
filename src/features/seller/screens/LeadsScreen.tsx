import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { openThreadThunk } from '../../../store/slices/chatSlice';
import {
  loadLeadsThunk,
  setLeadStatusThunk,
} from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';
import type { LeadStatus } from '../types';

const TABS: Array<{ id: 'all' | LeadStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'visit_booked', label: 'Visit booked' },
  { id: 'closed_won', label: 'Won' },
  { id: 'closed_lost', label: 'Lost' },
];

const statusMeta = (s: LeadStatus): { label: string; tone: 'info' | 'warning' | 'success' | 'error' | 'accent' } => {
  switch (s) {
    case 'new':
      return { label: 'New', tone: 'info' };
    case 'contacted':
      return { label: 'Contacted', tone: 'warning' };
    case 'visit_booked':
      return { label: 'Visit Booked', tone: 'accent' };
    case 'closed_won':
      return { label: 'Won', tone: 'success' };
    case 'closed_lost':
      return { label: 'Lost', tone: 'error' };
  }
};

type LeadsRouteProp = RouteProp<{ Leads: { initialTab?: 'all' | LeadStatus } | undefined }, 'Leads'>;

export const LeadsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<LeadsRouteProp>();
  const dispatch = useAppDispatch();
  const { leads, loading } = useAppSelector(s => s.seller);
  const [tab, setTab] = useState<'all' | LeadStatus>(route.params?.initialTab ?? 'all');
  const [refreshing, setRefreshing] = useState(false);

  // If we navigate back to this screen with a different initial tab param,
  // honor it without unmounting the screen.
  useEffect(() => {
    if (route.params?.initialTab) setTab(route.params.initialTab);
  }, [route.params?.initialTab]);

  // Reload every time this screen is focused — buyers booking visits or
  // submitting inquiries don't push state to the seller's running app, so
  // we re-fetch on every entry instead of only on mount.
  useFocusEffect(
    useCallback(() => {
      dispatch(loadLeadsThunk());
    }, [dispatch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadLeadsThunk());
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (tab === 'all') return leads;
    return leads.filter(l => l.status === tab);
  }, [leads, tab]);

  const counts = useMemo(
    () => ({
      total: leads.length,
      newCount: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      won: leads.filter(l => l.status === 'closed_won').length,
    }),
    [leads],
  );

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title="Leads"
        showBack={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Card padding={14}>
          <View style={styles.statsRow}>
            <Stat label="Total" value={counts.total} color={theme.colors.text} />
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <Stat label="New" value={counts.newCount} color={theme.colors.info} />
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <Stat label="Contacted" value={counts.contacted} color={theme.colors.warning} />
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <Stat label="Won" value={counts.won} color={theme.colors.success} />
          </View>
        </Card>
      </View>

      <View style={styles.tabs}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={t => t.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item: t }) => {
            const active = tab === t.id;
            return (
              <Pressable
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
          }}
        />
      </View>

      {loading && leads.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} height={120} borderRadius={16} style={{ marginBottom: 14 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={l => l.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => {
            const meta = statusMeta(item.status);
            return (
              <Card padding={14} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar name={item.consumerName} size={44} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text variant="bodyLg" weight="700">{item.consumerName}</Text>
                    <Text variant="caption" color="textMuted" style={{ marginTop: 1 }}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </View>

                <View style={[styles.listingRow, { backgroundColor: theme.colors.divider + '40', borderRadius: 10 }]}>
                  <Image source={{ uri: item.listingImage }} style={styles.listingImage} />
                  <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
                    <Text variant="caption" color="textMuted">Inquired about</Text>
                    <Text variant="bodySm" weight="700" numberOfLines={1}>
                      {item.listingTitle}
                    </Text>
                  </View>
                </View>

                {item.message && (
                  <Text variant="bodySm" color="textSecondary" style={{ marginTop: 10, lineHeight: 19 }}>
                    "{item.message}"
                  </Text>
                )}

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={async () => {
                      Linking.openURL(`tel:${item.consumerPhone}`);
                      // Calling a brand-new lead means we've engaged the
                      // buyer — auto-advance the funnel so this lead leaves
                      // 'New' without needing an extra tap. We don't regress
                      // contacted/visit_booked/closed_* leads.
                      if (item.status === 'new') {
                        await dispatch(setLeadStatusThunk({ id: item.id, status: 'contacted' }));
                        if (item.id.startsWith('visit_')) dispatch(loadLeadsThunk());
                      }
                    }}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                  >
                    <Icon name="call" size={14} color="#fff" />
                    <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 5 }}>
                      Call
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      Linking.openURL(
                        `https://wa.me/91${item.consumerPhone}?text=Hi%20${item.consumerName.split(' ')[0]}%2C%20regarding%20your%20inquiry%20on%20${encodeURIComponent(item.listingTitle)}`,
                      );
                      if (item.status === 'new') {
                        await dispatch(setLeadStatusThunk({ id: item.id, status: 'contacted' }));
                        if (item.id.startsWith('visit_')) dispatch(loadLeadsThunk());
                      }
                    }}
                    style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                  >
                    <Icon name="logo-whatsapp" size={14} color="#fff" />
                    <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 5 }}>
                      WhatsApp
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (!item.listingId) return;
                      // Lead carries consumerId (the buyer); seller-flow
                      // openThread requires it explicitly.
                      const buyerId = item.consumerId;
                      if (!buyerId) return;
                      const action = await dispatch(
                        openThreadThunk({ listingId: item.listingId, buyerId }),
                      );
                      if (openThreadThunk.fulfilled.match(action)) {
                        (navigation as any).navigate('ChatsTab', {
                          screen: 'Chat',
                          params: { threadId: action.payload.id },
                        });
                      }
                    }}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '20' }]}
                  >
                    <Icon name="chatbubble-ellipses" size={14} color={theme.colors.primary} />
                    <Text variant="caption" weight="700" style={{ color: theme.colors.primary, marginLeft: 5 }}>
                      Message
                    </Text>
                  </Pressable>
                  {item.status !== 'closed_won' && item.status !== 'closed_lost' && (
                    <Pressable
                      onPress={async () => {
                        const next: LeadStatus =
                          item.status === 'new'
                            ? 'contacted'
                            : item.status === 'contacted'
                            ? 'visit_booked'
                            : 'closed_won';
                        await dispatch(setLeadStatusThunk({ id: item.id, status: next }));
                        // Visit-derived leads get *promoted* to real Lead rows
                        // server-side, so their id changes. Reload to reconcile
                        // the synthesized row with the freshly-persisted lead.
                        if (item.id.startsWith('visit_')) {
                          dispatch(loadLeadsThunk());
                        }
                      }}
                      style={[styles.actionBtn, { backgroundColor: theme.colors.success + '20' }]}
                    >
                      <Icon name="checkmark" size={14} color={theme.colors.success} />
                    </Pressable>
                  )}
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                iconName="people-outline"
                title="No leads yet"
                message="Once buyers inquire on your listings, they'll appear here."
                actionLabel="View Listings"
                onActionPress={() => navigation.navigate('MyListings')}
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
    <Text variant="h3" weight="800" style={{ color }}>{value}</Text>
    <Text variant="caption" color="textMuted">{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
  },
  tabs: {},
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
  },
  listingImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
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

import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Avatar,
  Card,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  loadAnalyticsThunk,
  loadLeadsThunk,
  loadListingsThunk,
} from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';

export const SellerHomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const { listings, leads, analytics } = useAppSelector(s => s.seller);

  useEffect(() => {
    dispatch(loadListingsThunk());
    dispatch(loadLeadsThunk());
    dispatch(loadAnalyticsThunk());
  }, [dispatch]);

  const live = listings.filter(l => l.status === 'live').length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const recentLeads = leads.slice(0, 3);
  const seller = user?.seller;

  return (
    <Screen edges={['top']} background={theme.colors.background}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Avatar name={user?.fullName ?? 'Seller'} uri={user?.avatar} size={44} />
              <View style={{ marginLeft: 10 }}>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Welcome back
                </Text>
                <Text variant="bodyLg" weight="700" style={{ color: '#fff' }}>
                  {user?.fullName?.split(' ')[0] ?? 'Seller'} 👋
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.planChip}
              onPress={() => navigation.navigate('Plans')}
            >
              <Icon name="flash" size={12} color={theme.colors.accent} />
              <Text variant="caption" weight="800" style={{ color: '#fff', marginLeft: 4, letterSpacing: 0.6 }}>
                {seller?.plan?.toUpperCase() ?? 'FREE'}
              </Text>
            </Pressable>
          </View>

          <Text variant="h2" weight="800" style={{ color: '#fff', marginTop: 18, letterSpacing: -0.3 }}>
            Sell smarter on Aabroo
          </Text>
          <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
            {live} live · {newLeads} new lead{newLeads === 1 ? '' : 's'} waiting
          </Text>

          <View style={styles.kpisRow}>
            <Kpi icon="eye" label="Views" value={analytics?.totalViews ?? 0} />
            <View style={styles.kpiDiv} />
            <Kpi icon="document-text" label="Inquiries" value={analytics?.totalInquiries ?? 0} />
            <View style={styles.kpiDiv} />
            <Kpi icon="call" label="Callbacks" value={analytics?.totalCallbacks ?? 0} />
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
          <Pressable onPress={() => navigation.navigate('AddListing')}>
            <LinearGradient
              colors={[theme.colors.accent, theme.colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <View style={styles.ctaIcon}>
                <Icon name="add" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text weight="800" style={{ color: '#fff', fontSize: 17 }}>
                  Post a property
                </Text>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                  Reach 1M+ buyers in seconds
                </Text>
              </View>
              <Icon name="arrow-forward" size={22} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        <SectionHeader
          title="Quick actions"
          style={{ marginTop: 20 }}
        />
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10 }}>
          <QuickAction
            icon="business-outline"
            label="My Listings"
            count={listings.length}
            onPress={() => navigation.navigate('MyListings')}
          />
          <QuickAction
            icon="people-outline"
            label="Leads"
            count={leads.length}
            badge={newLeads > 0 ? newLeads : undefined}
            onPress={() => navigation.navigate('Leads')}
          />
          <QuickAction
            icon="bar-chart-outline"
            label="Analytics"
            count={analytics?.conversionRate ? `${analytics.conversionRate}%` : '—'}
            countLabel="conv."
            onPress={() => navigation.navigate('Analytics')}
          />
        </View>

        <SectionHeader
          title="Recent leads"
          actionLabel={leads.length > 0 ? 'See all' : undefined}
          onActionPress={() => navigation.navigate('Leads')}
          style={{ marginTop: 24 }}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {recentLeads.length === 0 ? (
            <Card>
              <Text variant="bodySm" color="textMuted" align="center">
                No leads yet. Post a listing to get started.
              </Text>
            </Card>
          ) : (
            recentLeads.map(l => (
              <Card key={l.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar name={l.consumerName} size={42} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text weight="700">{l.consumerName}</Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {l.listingTitle} · {timeAgo(l.createdAt)}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </View>
              </Card>
            ))
          )}
        </View>

        {seller?.plan === 'free' && (
          <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
            <Pressable onPress={() => navigation.navigate('Plans')}>
              <LinearGradient
                colors={['#1F2940', theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeCard}
              >
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="rocket" size={18} color={theme.colors.accent} />
                    <Text weight="800" style={{ color: '#fff', marginLeft: 6, fontSize: 17 }}>
                      Upgrade to Pro
                    </Text>
                  </View>
                  <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                    Unlimited listings · Featured placement · 3.4x more leads
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const Kpi: React.FC<{ icon: string; label: string; value: number }> = ({ icon, label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Icon name={icon as any} size={16} color="rgba(255,255,255,0.85)" />
    <Text variant="h3" weight="800" style={{ color: '#fff', marginTop: 4 }}>
      {value.toLocaleString()}
    </Text>
    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
      {label}
    </Text>
  </View>
);

const QuickAction: React.FC<{
  icon: string;
  label: string;
  count: number | string;
  countLabel?: string;
  badge?: number;
  onPress: () => void;
}> = ({ icon, label, count, countLabel, badge, onPress }) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.qa,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
      ]}
    >
      <View style={[styles.qaIcon, { backgroundColor: theme.colors.primary + '14' }]}>
        <Icon name={icon as any} size={20} color={theme.colors.primary} />
        {badge !== undefined && badge > 0 && (
          <View style={[styles.qaBadge, { backgroundColor: theme.colors.error }]}>
            <Text variant="caption" weight="800" style={{ color: '#fff', fontSize: 9 }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text variant="caption" color="textMuted" style={{ marginTop: 8 }}>{label}</Text>
      <Text variant="h3" weight="800" style={{ marginTop: 2 }} numberOfLines={1}>
        {count}
      </Text>
      {countLabel && (
        <Text variant="caption" color="textMuted">{countLabel}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 60,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  kpisRow: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  kpiDiv: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qa: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  qaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
});

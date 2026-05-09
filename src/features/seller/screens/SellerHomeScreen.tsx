import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Avatar,
  Card,
  CountUp,
  FadeSlideIn,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { UpgradeProCard } from '../components/UpgradeProCard';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  loadAnalyticsThunk,
  loadLeadsThunk,
  loadListingsThunk,
  loadSellerVisitsThunk,
} from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';

export const SellerHomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const { listings, leads, analytics, visits } = useAppSelector(s => s.seller);

  useEffect(() => {
    dispatch(loadListingsThunk());
    dispatch(loadLeadsThunk());
    dispatch(loadAnalyticsThunk());
    dispatch(loadSellerVisitsThunk());
  }, [dispatch]);

  const live = listings.filter(l => l.status === 'live').length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const upcomingVisits = visits.filter(v => v.status === 'upcoming').length;
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
              <Avatar name={user?.fullName ?? 'Seller'} uri={user?.avatar} size={44} inverse />
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
            <Kpi icon="eye" label="Views" value={analytics?.totalViews ?? 0} delay={120} />
            <View style={styles.kpiDiv} />
            <Kpi icon="document-text" label="Inquiries" value={analytics?.totalInquiries ?? 0} delay={200} />
            <View style={styles.kpiDiv} />
            <Kpi icon="call" label="Callbacks" value={analytics?.totalCallbacks ?? 0} delay={280} />
          </View>
        </LinearGradient>

        <FadeSlideIn delay={220} style={{ paddingHorizontal: 20, marginTop: -40 }}>
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
        </FadeSlideIn>

        {upcomingVisits > 0 && (
          <FadeSlideIn delay={260} style={{ paddingHorizontal: 20, marginTop: 14 }}>
            <Pressable
              onPress={() => navigation.navigate('SellerVisits', { initialTab: 'upcoming' })}
              style={[
                styles.visitTile,
                {
                  backgroundColor: theme.colors.success + '14',
                  borderColor: theme.colors.success + '40',
                },
              ]}
            >
              <View style={[styles.visitIcon, { backgroundColor: theme.colors.success }]}>
                <Icon name="calendar" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text weight="800" style={{ color: theme.colors.success }}>
                  {upcomingVisits} upcoming site visit{upcomingVisits === 1 ? '' : 's'}
                </Text>
                <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                  See who's coming, when, and how to reach them
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.success} />
            </Pressable>
          </FadeSlideIn>
        )}

        <FadeSlideIn delay={300}>
        <SectionHeader
          title="Quick actions"
          style={{ marginTop: 20 }}
        />
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10 }}>
          <FadeSlideIn delay={340} style={{ flex: 1 }}>
            <QuickAction
              icon="business-outline"
              label="My Listings"
              count={listings.length}
              onPress={() => navigation.navigate('MyListings')}
            />
          </FadeSlideIn>
          <FadeSlideIn delay={380} style={{ flex: 1 }}>
            <QuickAction
              icon="people-outline"
              label="Leads"
              count={leads.length}
              badge={newLeads > 0 ? newLeads : undefined}
              onPress={() => navigation.navigate('Leads')}
            />
          </FadeSlideIn>
          <FadeSlideIn delay={420} style={{ flex: 1 }}>
            <QuickAction
              icon="bar-chart-outline"
              label="Analytics"
              count={analytics?.conversionRate ? `${analytics.conversionRate}%` : '—'}
              countLabel="conv."
              onPress={() => navigation.navigate('Analytics')}
            />
          </FadeSlideIn>
        </View>
        </FadeSlideIn>

        <FadeSlideIn delay={460}>
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
            recentLeads.map((l, i) => (
              <FadeSlideIn key={l.id} delay={500 + i * 50}>
                <Card
                  style={{ marginBottom: 10 }}
                  onPress={() => navigation.navigate('Leads')}
                >
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
              </FadeSlideIn>
            ))
          )}
        </View>
        </FadeSlideIn>

        {seller?.plan === 'free' && (
          <FadeSlideIn delay={700} style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <UpgradeProCard onPress={() => navigation.navigate('Plans')} />
          </FadeSlideIn>
        )}
      </ScrollView>
    </Screen>
  );
};

const Kpi: React.FC<{ icon: string; label: string; value: number; delay?: number }> = ({
  icon,
  label,
  value,
  delay = 0,
}) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Icon name={icon as any} size={16} color="rgba(255,255,255,0.85)" />
    <CountUp
      to={value}
      duration={1200}
      delay={delay}
      variant="h3"
      weight="800"
      style={{ color: '#fff', marginTop: 4 } as any}
    />
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
  visitTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  visitIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

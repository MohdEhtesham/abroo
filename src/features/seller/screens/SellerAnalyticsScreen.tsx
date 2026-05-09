import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loadAnalyticsThunk } from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const SellerAnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const analytics = useAppSelector(s => s.seller.analytics);

  useEffect(() => {
    dispatch(loadAnalyticsThunk());
  }, [dispatch]);

  if (!analytics) {
    return (
      <Screen edges={['top']}>
        <AnimatedHeader title="Analytics" showBack={false} />
      </Screen>
    );
  }

  const max = Math.max(...analytics.weeklyViews, 1);

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Analytics" showBack={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.kpiGrid}>
            <Kpi
              icon="eye"
              gradient={[theme.colors.primary, theme.colors.primaryDark]}
              label="Total Views"
              value={analytics.totalViews.toLocaleString()}
              delta="+18.2%"
            />
            <Kpi
              icon="document-text"
              gradient={[theme.colors.success, '#0E8A66']}
              label="Inquiries"
              value={analytics.totalInquiries.toLocaleString()}
              delta="+12.5%"
            />
            <Kpi
              icon="call"
              gradient={[theme.colors.accent, theme.colors.accentDark]}
              label="Callbacks"
              value={analytics.totalCallbacks.toLocaleString()}
              delta="+5.8%"
            />
            <Kpi
              icon="heart"
              gradient={['#EF4444', '#B91C1C']}
              label="Saves"
              value={analytics.totalSaves.toLocaleString()}
              delta="+9.4%"
            />
          </View>
        </View>

        <SectionHeader title="Last 7 days · Views" subtitle={`Conversion rate ${analytics.conversionRate}%`} />
        <View style={{ paddingHorizontal: 20 }}>
          <Card padding={20}>
            <View style={styles.chartArea}>
              {analytics.weeklyViews.map((v, i) => {
                const heightPct = (v / max) * 100;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <Text variant="caption" weight="600" style={{ marginBottom: 6 }}>
                      {v}
                    </Text>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.primaryDark]}
                      style={[styles.bar, { height: `${heightPct}%` }]}
                    />
                    <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                      {DAYS[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        <SectionHeader title="Top performing listings" />
        <View style={{ paddingHorizontal: 20 }}>
          {analytics.topListings.length === 0 ? (
            <Card>
              <Text variant="bodySm" color="textMuted" align="center">
                No live listings yet.
              </Text>
            </Card>
          ) : (
            analytics.topListings.map((l, i) => (
              <Card key={l.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.rank, { backgroundColor: theme.colors.primary + '14' }]}>
                    <Text weight="800" style={{ color: theme.colors.primary }}>
                      {i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="bodyLg" weight="700" numberOfLines={1}>{l.title}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <Icon name="eye-outline" size={13} color={theme.colors.textMuted} />
                      <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                        {l.views.toLocaleString()} views
                      </Text>
                      <Text variant="caption" color="textMuted" style={{ marginHorizontal: 8 }}>•</Text>
                      <Icon name="document-text-outline" size={13} color={theme.colors.textMuted} />
                      <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                        {l.inquiries} inquiries
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <Card
            style={{
              backgroundColor: theme.colors.accent + '14',
              borderColor: theme.colors.accent + '40',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.tipIcon, { backgroundColor: theme.colors.accent }]}>
                <Icon name="bulb" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text weight="700">Boost performance</Text>
                <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4 }}>
                  Pro plan listings get 3.4x more views on average.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
};

const Kpi: React.FC<{
  icon: string;
  gradient: [string, string];
  label: string;
  value: string;
  delta: string;
}> = ({ icon, gradient, label, value, delta }) => (
  <LinearGradient
    colors={gradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.kpiCard}
  >
    <View style={styles.kpiIcon}>
      <Icon name={icon as any} size={18} color="#fff" />
    </View>
    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>
      {label}
    </Text>
    <Text variant="h2" weight="800" style={{ color: '#fff', marginTop: 2 }}>
      {value}
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
      <Icon name="trending-up" size={12} color="#fff" />
      <Text variant="caption" weight="600" style={{ color: '#fff', marginLeft: 4 }}>
        {delta}
      </Text>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  kpiCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 16,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    gap: 8,
  },
  bar: {
    width: '70%',
    borderRadius: 8,
  },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

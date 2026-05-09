import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  FadeSlideIn,
  FeaturedCarousel,
  PropertyCard,
  PropertyCardSkeleton,
  Screen,
  SearchBar,
  SectionHeader,
  Text,
} from '../../../components';
import { CITIES, PROPERTY_TYPES } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loadHomeThunk, toggleSaved } from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { featured, trending, recommended, homeLoading, saved } = useAppSelector(s => s.property);
  const { user } = useAppSelector(s => s.auth);
  const unread = useAppSelector(s => s.notification.list.filter(n => !n.read).length);

  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState('Gurgaon');

  useEffect(() => {
    dispatch(loadHomeThunk());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadHomeThunk());
    setRefreshing(false);
  };

  const goSearch = () => navigation.navigate('PropertyStack', { screen: 'Search' });
  const goDetail = (id: string) => navigation.navigate('PropertyStack', { screen: 'PropertyDetail', params: { id } });
  const goNotifs = () => navigation.navigate('NotificationsStack');

  return (
    <Screen edges={['top']} background={theme.colors.background}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={[styles.heroGradient, { paddingTop: 14 }]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.navigate('ProfileStack')} style={styles.userRow}>
              <Avatar name={user?.fullName ?? 'Guest'} uri={user?.avatar} size={42} />
              <View style={{ marginLeft: 10 }}>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Welcome back
                </Text>
                <Text variant="bodyLg" weight="700" style={{ color: '#fff' }}>
                  {user?.fullName?.split(' ')[0] ?? 'Hi there'} 👋
                </Text>
              </View>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable onPress={goNotifs} style={styles.iconBtn}>
                <Icon name="notifications-outline" size={20} color="#fff" />
                {unread > 0 && (
                  <View style={[styles.dot, { backgroundColor: theme.colors.accent }]}>
                    <Text variant="caption" weight="700" style={{ color: '#fff', fontSize: 9 }}>
                      {unread}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          <FadeSlideIn delay={60} style={{ marginTop: 18 }}>
            <Text variant="h2" weight="800" style={{ color: '#fff', letterSpacing: -0.3 }}>
              Find your dream home
            </Text>
            <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              From curated, premium listings across India
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={140} style={{ marginTop: 18 }}>
            <SearchBar onPress={goSearch} editable={false} />
          </FadeSlideIn>
        </LinearGradient>

        <FadeSlideIn delay={200}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityRow}
        >
          {CITIES.map(c => (
            <Pressable
              key={c}
              onPress={() => setCity(c)}
              style={[
                styles.cityChip,
                {
                  backgroundColor: c === city ? theme.colors.primary : theme.colors.surfaceElevated,
                  borderColor: c === city ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Icon
                name="location"
                size={13}
                color={c === city ? '#fff' : theme.colors.textMuted}
              />
              <Text
                variant="bodySm"
                weight="600"
                style={{ color: c === city ? '#fff' : theme.colors.text, marginLeft: 5 }}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        </FadeSlideIn>

        <FadeSlideIn delay={260}>
        <SectionHeader title="Browse by category" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {PROPERTY_TYPES.map((t, i) => (
            <FadeSlideIn key={t.id} delay={300 + i * 35}>
              <Pressable
                style={[styles.catCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                onPress={() =>
                  navigation.navigate('PropertyStack', { screen: 'PropertyList', params: { type: t.id, title: t.label } })
                }
              >
                <View style={[styles.catIcon, { backgroundColor: theme.colors.primary + '14' }]}>
                  <Icon name={t.icon as any} size={22} color={theme.colors.primary} />
                </View>
                <Text variant="bodySm" weight="700" style={{ marginTop: 8 }}>{t.label}</Text>
              </Pressable>
            </FadeSlideIn>
          ))}
        </ScrollView>
        </FadeSlideIn>

        <FadeSlideIn delay={380}>
        <SectionHeader
          title="Featured projects"
          subtitle="Hand-picked premium listings"
          actionLabel="View all"
          onActionPress={() => navigation.navigate('PropertyStack', { screen: 'PropertyList', params: { title: 'Featured' } })}
        />
        {homeLoading ? (
          <View style={{ paddingHorizontal: 20 }}>
            <PropertyCardSkeleton />
          </View>
        ) : (
          <FeaturedCarousel data={featured} onPress={p => goDetail(p.id)} />
        )}
        </FadeSlideIn>

        <FadeSlideIn delay={440}>
        <SectionHeader
          title="Trending now"
          subtitle="Most-viewed projects this week"
          actionLabel="See all"
          onActionPress={() => navigation.navigate('PropertyStack', { screen: 'PropertyList', params: { title: 'Trending' } })}
          style={{ marginTop: 24 }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        >
          {homeLoading
            ? [1, 2].map(i => <PropertyCardSkeleton key={i} width={280} />)
            : trending.map((p, i) => (
                <FadeSlideIn key={p.id} delay={500 + i * 40}>
                  <PropertyCard
                    property={p}
                    onPress={() => goDetail(p.id)}
                    onSavePress={() => dispatch(toggleSaved(p.id))}
                    saved={saved.includes(p.id)}
                  />
                </FadeSlideIn>
              ))}
        </ScrollView>
        </FadeSlideIn>

        <FadeSlideIn delay={560}>
        <SectionHeader
          title="Recommended for you"
          subtitle="Based on your preferences"
          style={{ marginTop: 24 }}
        />
        </FadeSlideIn>
        <View style={{ paddingHorizontal: 20 }}>
          {homeLoading
            ? [1, 2].map(i => <PropertyCardSkeleton key={i} />)
            : recommended.slice(0, 4).map((p, i) => (
                <FadeSlideIn key={p.id} delay={600 + i * 50}>
                  <PropertyCard
                    property={p}
                    variant="wide"
                    onPress={() => goDetail(p.id)}
                    onSavePress={() => dispatch(toggleSaved(p.id))}
                    saved={saved.includes(p.id)}
                    style={{ marginBottom: 16 }}
                  />
                </FadeSlideIn>
              ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  heroGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityRow: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  catRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  catCard: {
    width: 96,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

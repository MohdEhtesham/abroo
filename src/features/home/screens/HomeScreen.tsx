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
import { PROPERTY_TYPES } from '../../../constants';
import { useThrottledCallback } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  clearRecentLocations,
  loadHomeThunk,
  setLocation,
  toggleSaved,
} from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';
import { LocationPicker } from '../../location/components/LocationPicker';
import type { LocationSearchResult } from '../../location/services/locationService';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { featured, trending, recommended, homeLoading, saved } = useAppSelector(s => s.property);
  const selectedLocation = useAppSelector(s => s.property.selectedLocation);
  const recentLocations = useAppSelector(s => s.property.recentLocations);
  const { user } = useAppSelector(s => s.auth);
  const unread = useAppSelector(s => s.notification.list.filter(n => !n.read).length);

  const [refreshing, setRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const onLocationPicked = (r: LocationSearchResult) => {
    dispatch(
      setLocation({
        primary: r.primary,
        secondary: r.secondary,
        city: r.city,
        locality: r.locality,
        state: r.state,
        lat: r.lat,
        lng: r.lng,
      }),
    );
  };

  // Recents need to be in LocationSearchResult shape for the picker; only
  // primary/secondary/city/locality round-trip back into setLocation.
  const recentsForPicker = recentLocations.map((r, i) => ({
    id: `recent-${i}`,
    displayName: r.primary,
    primary: r.primary,
    secondary: r.secondary ?? '',
    city: r.city,
    locality: r.locality,
    state: r.state,
    lat: r.lat ?? 0,
    lng: r.lng ?? 0,
    kind: 'recent',
  }));

  useEffect(() => {
    dispatch(loadHomeThunk());
    // The home thunk doesn't take filters today (the featured / trending
    // /recommended endpoints are global), but we still refresh on location
    // change so any future location-aware home content stays in sync.
  }, [dispatch, selectedLocation?.city, selectedLocation?.locality]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadHomeThunk());
    setRefreshing(false);
  };

  // Multi-tap guard: prevent double-pushed detail screens / nav stack duplication
  const goSearch = useThrottledCallback(
    () => navigation.navigate('PropertyStack', { screen: 'Search' }),
  );
  const goDetail = useThrottledCallback((id: string) =>
    navigation.navigate('PropertyStack', { screen: 'PropertyDetail', params: { id } }),
  );
  const goNotifs = useThrottledCallback(() => navigation.navigate('NotificationsStack'));

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
              <Avatar name={user?.fullName ?? 'Guest'} uri={user?.avatar} size={42} inverse />
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
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[
              styles.locationPill,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.locationDot, { backgroundColor: theme.colors.primary + '14' }]}>
              <Icon name="location" size={16} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="caption" color="textMuted" style={{ letterSpacing: 0.4 }}>
                LOCATION
              </Text>
              <Text variant="body" weight="700" numberOfLines={1} style={{ marginTop: 1 }}>
                {selectedLocation
                  ? selectedLocation.locality
                    ? `${selectedLocation.locality}, ${selectedLocation.city}`
                    : selectedLocation.city
                  : 'Search any city or area in India'}
              </Text>
            </View>
            <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
              {selectedLocation ? 'Change' : 'Choose'}
            </Text>
          </Pressable>
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

      <LocationPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onLocationPicked}
        recents={recentsForPicker}
        onClearRecents={() => dispatch(clearRecentLocations())}
      />
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
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  locationDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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

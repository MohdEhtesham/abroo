import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  Card,
  EmptyState,
  FadeSlideIn,
  ImageCarousel,
  PropertyCard,
  Screen,
  SectionHeader,
  StatusBadge,
  Text,
} from '../../../components';
import { useIsMounted, useThrottledCallback } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../store';
import { openThreadThunk } from '../../../store/slices/chatSlice';
import { toggleSaved } from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';
import { SCREEN_WIDTH } from '../../../utils/dimensions';
import { formatArea, formatCurrency } from '../../../utils/format';
import { safeArray } from '../../../utils/safe';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70';

export const PropertyDetailScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string | undefined;
  const dispatch = useAppDispatch();
  const saved = useAppSelector(s => s.property.saved);
  const isMounted = useIsMounted();

  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const isSaved = useMemo(() => (id ? saved.includes(id) : false), [saved, id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErrored(true);
      return;
    }
    setLoading(true);
    setErrored(false);

    (async () => {
      try {
        const [p, s] = await Promise.all([
          propertyService.detail(id).catch(() => null),
          propertyService.similar(id).catch(() => [] as Property[]),
        ]);
        if (!isMounted()) return;
        setProperty(p);
        setSimilar(safeArray(s));
        if (!p) setErrored(true);
      } catch {
        if (isMounted()) setErrored(true);
      } finally {
        if (isMounted()) setLoading(false);
      }
    })();
  }, [id, isMounted]);

  // ─── HOOKS — must all be called unconditionally, before any early return ───
  // Throttled navigation handlers reference property?.id at call time, so they
  // are safe even when `property` is null on the first render.
  const goInquiry = useThrottledCallback(() => {
    if (!property?.id) return;
    navigation.navigate('InquiryStack', {
      screen: 'InquiryForm',
      params: { propertyId: property.id },
    });
  });
  const goSchedule = useThrottledCallback(() => {
    if (!property?.id) return;
    navigation.navigate('VisitsStack', {
      screen: 'ScheduleVisit',
      params: { propertyId: property.id },
    });
  });
  // Open the buyer↔seller chat for this listing. Find-or-create via the
  // backend (idempotent), then deep-link into the conversation inside the
  // Chats tab. We route through Main → ChatsTab so the bottom-tab tree
  // owns the navigation state.
  const goChat = useThrottledCallback(async () => {
    if (!property?.id) return;
    const action = await dispatch(openThreadThunk(property.id));
    if (openThreadThunk.fulfilled.match(action)) {
      navigation.navigate('Main' as never, {
        screen: 'ChatsTab',
        params: { screen: 'Chat', params: { threadId: action.payload.id } },
      } as never);
    } else {
      Alert.alert(
        'Could not open chat',
        (action.payload as string | undefined) ?? 'Please try again.',
      );
    }
  });
  const goSimilar = useThrottledCallback((sid: string) =>
    navigation.push('PropertyDetail', { id: sid }),
  );

  // Loading state
  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  // Error / not-found state — graceful fallback instead of white screen
  if (errored || !property) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={[styles.iconCircle, { backgroundColor: theme.colors.divider }]}
          >
            <Icon name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            iconName="warning-outline"
            title="Could not load property"
            message="This property may have been removed or there was a network issue."
            actionLabel="Go back"
            onActionPress={() => navigation.goBack()}
          />
        </View>
      </Screen>
    );
  }

  // Defensive accessors — safe even on incomplete (e.g. seller-listed) properties
  const images = safeArray(property.images);
  const carouselImages = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const builder = property.builder ?? '';
  const builderInfo = property.builderInfo ?? null;
  const configuration = safeArray(property.configuration);
  const highlights = safeArray(property.highlights);
  const amenities = safeArray(property.amenities);
  const floorPlans = safeArray(property.floorPlans);
  const rating = typeof property.rating === 'number' ? property.rating : null;
  const reviewCount = property.reviewCount ?? 0;
  const priceMin = property.priceMin ?? 0;
  const priceMax = property.priceMax ?? priceMin;
  const pricePerSqft = property.pricePerSqft ?? 0;
  const totalTowers = property.totalTowers ?? 0;
  const totalUnits = property.totalUnits ?? 0;
  const areaMin = property.areaMin ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <View style={{ height: 320 }}>
          <ImageCarousel images={carouselImages} height={320} width={SCREEN_WIDTH} />
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} style={styles.topGradient} />
          <View style={[styles.topRow, { top: insets.top + 8 }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconCircle}>
              <Icon name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={styles.iconCircle} onPress={() => Alert.alert('Share', 'Share property')}>
                <Icon name="share-outline" size={20} color="#fff" />
              </Pressable>
              <Pressable style={styles.iconCircle} onPress={() => dispatch(toggleSaved(property.id))}>
                <Icon name={isSaved ? 'heart' : 'heart-outline'} size={20} color={isSaved ? theme.colors.error : '#fff'} />
              </Pressable>
            </View>
          </View>
          <View style={[styles.imageBadges, { bottom: 18 }]}>
            {!!property.possessionStatus && (
              <StatusBadge label={property.possessionStatus} tone="accent" size="md" />
            )}
            {property.featured && <StatusBadge label="FEATURED" tone="info" size="md" style={{ marginLeft: 6 }} />}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          {!!builder && (
            <Text variant="caption" weight="700" style={{ color: theme.colors.accent, letterSpacing: 1.5 }}>
              {builder.toUpperCase()}
            </Text>
          )}
          <Text variant="h1" weight="800" style={{ marginTop: 4, letterSpacing: -0.3 }}>
            {property.title ?? 'Untitled property'}
          </Text>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Icon name="location" size={14} color={theme.colors.textMuted} />
            <Text variant="bodySm" color="textSecondary" style={{ marginLeft: 6 }}>
              {[property.locality, property.city].filter(Boolean).join(', ') || '—'}
            </Text>
          </View>
          {rating !== null && (
            <View style={[styles.row, { marginTop: 6 }]}>
              <Icon name="star" size={14} color={theme.colors.accent} />
              <Text variant="bodySm" weight="700" style={{ marginLeft: 4 }}>
                {rating.toFixed(1)}
              </Text>
              <Text variant="bodySm" color="textMuted" style={{ marginLeft: 6 }}>
                ({reviewCount} reviews)
              </Text>
            </View>
          )}

          <FadeSlideIn delay={120}>
          <Card elevated={false} style={[styles.priceCard, { backgroundColor: theme.colors.primary }]}>
            <View>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Starting at</Text>
              <Text variant="h2" weight="800" style={{ color: '#fff', marginTop: 4 }}>
                {formatCurrency(priceMin)}
              </Text>
              <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {priceMax > priceMin ? `Up to ${formatCurrency(priceMax)}` : ''}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>₹/sq.ft</Text>
              <Text variant="h3" weight="700" style={{ color: '#fff', marginTop: 4 }}>
                ₹{(pricePerSqft || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={220}>
          <View style={styles.statsRow}>
            <Stat
              label="Configuration"
              value={configuration.length > 0 ? configuration.join(' / ') : '—'}
            />
            <Stat label="Area" value={areaMin > 0 ? `${formatArea(areaMin)}+` : '—'} />
            <Stat label="Towers" value={totalTowers > 0 ? String(totalTowers) : '—'} />
            <Stat
              label="Units"
              value={totalUnits > 0 ? totalUnits.toLocaleString('en-IN') : '—'}
            />
          </View>
          </FadeSlideIn>

          {!!property.description && (
            <FadeSlideIn delay={320}>
            <SectionHeader title="About this property" style={{ paddingHorizontal: 0 }} />
            <Text variant="body" color="textSecondary" style={{ lineHeight: 22 }}>
              {property.description}
            </Text>
            </FadeSlideIn>
          )}

          {highlights.length > 0 && (
            <>
              <SectionHeader title="Highlights" style={{ paddingHorizontal: 0, marginTop: 24 }} />
              <View style={{ gap: 10 }}>
                {highlights.map((h, i) => (
                  <View key={`${h}-${i}`} style={styles.highlightRow}>
                    <View style={[styles.checkBox, { backgroundColor: theme.colors.success + '22' }]}>
                      <Icon name="checkmark" size={14} color={theme.colors.success} />
                    </View>
                    <Text variant="body">{h}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {amenities.length > 0 && (
            <>
              <SectionHeader
                title="Amenities"
                subtitle={`${amenities.length} included`}
                style={{ paddingHorizontal: 0, marginTop: 24 }}
              />
              <View style={styles.amenityGrid}>
                {amenities.map((a, i) => (
                  <View
                    key={a?.id ?? `am-${i}`}
                    style={[
                      styles.amenityCard,
                      { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                    ]}
                  >
                    <Icon
                      name={(a?.iconName as any) ?? 'checkmark-circle-outline'}
                      size={22}
                      color={theme.colors.primary}
                    />
                    <Text variant="caption" weight="600" align="center" style={{ marginTop: 6 }}>
                      {a?.name ?? 'Amenity'}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {floorPlans.length > 0 && (
            <>
              <SectionHeader title="Floor plans" style={{ paddingHorizontal: 0, marginTop: 24 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {floorPlans.map((fp, i) => (
                  <View
                    key={fp?.id ?? `fp-${i}`}
                    style={[styles.fpCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  >
                    {!!fp?.imageUrl && <Image source={{ uri: fp.imageUrl }} style={styles.fpImage} />}
                    <View style={{ padding: 12 }}>
                      <Text variant="bodyLg" weight="700">{fp?.configuration ?? '—'}</Text>
                      <Text variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>
                        {fp?.area ? formatArea(fp.area) : '—'}
                      </Text>
                      <Text variant="bodyLg" weight="700" style={{ color: theme.colors.primary, marginTop: 8 }}>
                        {fp?.price ? formatCurrency(fp.price) : '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {builderInfo && (
            <>
              <SectionHeader title="About the builder" style={{ paddingHorizontal: 0, marginTop: 24 }} />
              <Card>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <View style={[styles.row, { flex: 1 }]}>
                    <Avatar name={builderInfo.name ?? builder ?? 'Builder'} size={50} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text variant="bodyLg" weight="700">{builderInfo.name ?? '—'}</Text>
                      {!!builderInfo.established && (
                        <Text variant="bodySm" color="textMuted">Est. {builderInfo.established}</Text>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {typeof builderInfo.rating === 'number' && builderInfo.rating > 0 && (
                      <View style={styles.row}>
                        <Icon name="star" size={14} color={theme.colors.accent} />
                        <Text variant="bodySm" weight="700" style={{ marginLeft: 4 }}>
                          {builderInfo.rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                    {!!builderInfo.projectsCompleted && (
                      <Text variant="caption" color="textMuted">
                        {builderInfo.projectsCompleted}+ projects
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </>
          )}

          {(property.address || property.reraId) && (
            <>
              <SectionHeader title="Location" style={{ paddingHorizontal: 0, marginTop: 24 }} />
              <Card padding={0} style={{ overflow: 'hidden' }}>
                <View style={{ height: 160, backgroundColor: theme.colors.divider }}>
                  <View style={[styles.row, styles.mapInner]}>
                    <Icon name="map" size={40} color={theme.colors.primary} />
                    <Text weight="600" style={{ marginLeft: 12, flex: 1 }}>
                      {property.address ?? `${property.locality ?? ''}, ${property.city ?? ''}`}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySm" color="textSecondary">
                    {property.reraId ? `RERA: ${property.reraId}` : 'RERA: not provided'}
                  </Text>
                  <Pressable onPress={() => navigation.navigate('MapView', { id: property.id })}>
                    <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>Open map</Text>
                  </Pressable>
                </View>
              </Card>
            </>
          )}

          {similar.length > 0 && (
            <>
              <SectionHeader title="Similar properties" style={{ paddingHorizontal: 0, marginTop: 24 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {similar.map(sp => (
                  <PropertyCard
                    key={sp.id}
                    property={sp}
                    onPress={() => goSimilar(sp.id)}
                    onSavePress={() => dispatch(toggleSaved(sp.id))}
                    saved={saved.includes(sp.id)}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.fabStack,
          { bottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={goChat}
          style={[
            styles.fab,
            styles.fabSecondary,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
        </Pressable>
        <Pressable
          onPress={goSchedule}
          style={[
            styles.fab,
            styles.fabSecondary,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="calendar" size={20} color={theme.colors.primary} />
        </Pressable>
        <Pressable
          onPress={goInquiry}
          style={[
            styles.fab,
            styles.fabSecondary,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="paper-plane" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={statStyles.box}>
    <Text variant="caption" color="textMuted">{label}</Text>
    <Text variant="bodySm" weight="700" style={{ marginTop: 2 }} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    paddingHorizontal: 4,
  },
});

const styles = StyleSheet.create({
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  topRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadges: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 14,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  amenityCard: {
    width: '23%',
    margin: '1%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  fpCard: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fpImage: {
    width: '100%',
    height: 110,
  },
  mapInner: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fabStack: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 12,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  fabSecondary: {
    borderWidth: 1,
  },
});

import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  Chip,
  CustomTextInput,
  GradientButton,
  KeyboardScreen,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import {
  BHK_OPTIONS,
  CITIES,
  POSSESSION_STATUS,
  PROPERTY_TYPES,
} from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { incrementListingQuota } from '../../../store/slices/authSlice';
import { createListingThunk } from '../../../store/slices/sellerSlice';
import { useTheme } from '../../../theme';
import { ALL_AMENITIES } from '../../property/mockData/amenities';
import type {
  PossessionStatus,
  PropertyType,
} from '../../property/types';
import type { ListingDraft } from '../types';

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70',
];

const STEPS = ['Basics', 'Pricing & Area', 'Photos', 'Amenities', 'Review'];

export const AddListingScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const submitting = useAppSelector(s => s.seller.submitting);

  const seller = user?.seller;
  const overQuota =
    seller && seller.listingQuotaUsed >= seller.listingQuotaTotal;

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>({
    title: '',
    description: '',
    type: 'apartment',
    city: 'Gurgaon',
    locality: '',
    address: '',
    priceMin: 0,
    priceMax: 0,
    pricePerSqft: 0,
    configuration: [],
    areaMin: 0,
    areaMax: 0,
    possessionStatus: 'Ready to Move',
    possessionDate: new Date().toISOString(),
    reraId: '',
    amenityIds: [],
    images: [],
  });

  const set = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const toggle = <K extends 'configuration' | 'amenityIds' | 'images'>(
    key: K,
    value: string,
  ) =>
    setDraft(d => {
      const list = d[key] as string[];
      const next = list.includes(value)
        ? list.filter(x => x !== value)
        : [...list, value];
      return { ...d, [key]: next };
    });

  const MAX_IMAGES = 10;

  const addImages = (uris: string[]) => {
    setDraft(d => {
      const remaining = MAX_IMAGES - d.images.length;
      if (remaining <= 0) {
        Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
        return d;
      }
      const next = [...d.images, ...uris.slice(0, remaining)];
      return { ...d, images: next };
    });
  };

  const removeImage = (uri: string) => {
    setDraft(d => ({ ...d, images: d.images.filter(x => x !== uri) }));
  };

  const takePhoto = async () => {
    if (draft.images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'back',
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Camera error', result.errorMessage ?? 'Could not open camera');
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) addImages([uri]);
    } catch (e: any) {
      Alert.alert('Camera unavailable', e?.message ?? 'Could not open camera');
    }
  };

  const pickFromGallery = async () => {
    if (draft.images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: MAX_IMAGES - draft.images.length,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Gallery error', result.errorMessage ?? 'Could not open gallery');
        return;
      }
      const uris = (result.assets ?? [])
        .map(a => a.uri)
        .filter((u): u is string => !!u);
      if (uris.length) addImages(uris);
    } catch (e: any) {
      Alert.alert('Gallery unavailable', e?.message ?? 'Could not open gallery');
    }
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (draft.title.trim().length < 5) return 'Title must be at least 5 characters';
      if (!draft.locality.trim()) return 'Locality is required';
      if (draft.description.trim().length < 20) return 'Description must be at least 20 characters';
    }
    if (step === 1) {
      if (draft.priceMin <= 0) return 'Enter a valid price';
      if (draft.areaMin <= 0) return 'Enter a valid area';
      if (draft.configuration.length === 0) return 'Pick at least one configuration';
    }
    if (step === 2) {
      if (draft.images.length === 0) return 'Add at least one photo';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      Alert.alert('Missing info', err);
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const submit = async () => {
    if (overQuota) {
      Alert.alert(
        'Listing limit reached',
        'Upgrade your plan to post more listings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Plans') },
        ],
      );
      return;
    }
    if (!user) return;
    const finalDraft: ListingDraft = {
      ...draft,
      priceMax: draft.priceMax || draft.priceMin,
      areaMax: draft.areaMax || draft.areaMin,
      pricePerSqft:
        draft.pricePerSqft ||
        (draft.areaMin > 0 ? Math.round(draft.priceMin / draft.areaMin) : 0),
    };
    const action = await dispatch(
      createListingThunk({ draft: finalDraft, ownerId: user.id }),
    );
    if (createListingThunk.fulfilled.match(action)) {
      dispatch(incrementListingQuota());
      Alert.alert('Listing posted!', 'Your property is now live on Aabroo.', [
        { text: 'View Listings', onPress: () => navigation.replace('MyListings') },
      ]);
    }
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Post Property" onBackPress={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={styles.stepperRow}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={s}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: done || active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    {done ? (
                      <Icon name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text variant="caption" weight="700" style={{ color: active ? '#fff' : theme.colors.textMuted }}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text variant="caption" weight={active ? '700' : '500'} style={{ marginTop: 4, color: active ? theme.colors.primary : theme.colors.textMuted }} numberOfLines={1}>
                    {s}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      { backgroundColor: done ? theme.colors.primary : theme.colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      <KeyboardScreen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}>
          {step === 0 && (
            <View>
              <Text variant="h3" weight="700">Basics</Text>
              <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, marginBottom: 18 }}>
                Tell buyers what you're selling.
              </Text>
              <CustomTextInput
                label="Listing title"
                placeholder="e.g. 3 BHK Sea-Facing Apartment"
                value={draft.title}
                onChangeText={v => set('title', v)}
              />
              <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginBottom: 6 }}>
                Property type
              </Text>
              <View style={styles.wrap}>
                {PROPERTY_TYPES.map(t => (
                  <Chip
                    key={t.id}
                    label={t.label}
                    iconName={t.icon}
                    selected={draft.type === t.id}
                    onPress={() => set('type', t.id as PropertyType)}
                  />
                ))}
              </View>
              <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginTop: 16, marginBottom: 6 }}>
                City
              </Text>
              <View style={styles.wrap}>
                {CITIES.map(c => (
                  <Chip
                    key={c}
                    label={c}
                    selected={draft.city === c}
                    onPress={() => set('city', c)}
                  />
                ))}
              </View>
              <View style={{ height: 16 }} />
              <CustomTextInput
                label="Locality / Area"
                placeholder="e.g. Worli, Sector 67"
                value={draft.locality}
                onChangeText={v => set('locality', v)}
              />
              <CustomTextInput
                label="Address (optional)"
                placeholder="Full address shown to buyers"
                value={draft.address}
                onChangeText={v => set('address', v)}
              />
              <CustomTextInput
                label="Description"
                placeholder="Highlight key features, condition, view, etc."
                multiline
                numberOfLines={5}
                value={draft.description}
                onChangeText={v => set('description', v)}
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <Text variant="h3" weight="700">Pricing & Area</Text>
              <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, marginBottom: 18 }}>
                What's the property worth?
              </Text>
              <CustomTextInput
                label="Asking price (₹)"
                placeholder="e.g. 11500000"
                keyboardType="number-pad"
                value={draft.priceMin > 0 ? String(draft.priceMin) : ''}
                onChangeText={v => set('priceMin', Number(v.replace(/\D/g, '')) || 0)}
              />
              <CustomTextInput
                label="Area (sq.ft)"
                placeholder="e.g. 1200"
                keyboardType="number-pad"
                value={draft.areaMin > 0 ? String(draft.areaMin) : ''}
                onChangeText={v => set('areaMin', Number(v.replace(/\D/g, '')) || 0)}
              />
              <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginBottom: 6 }}>
                Configuration (BHK)
              </Text>
              <View style={styles.wrap}>
                {BHK_OPTIONS.map(b => (
                  <Chip
                    key={b}
                    label={b}
                    selected={draft.configuration.includes(b)}
                    onPress={() => toggle('configuration', b)}
                  />
                ))}
              </View>
              <View style={{ height: 16 }} />
              <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginBottom: 6 }}>
                Possession status
              </Text>
              <View style={styles.wrap}>
                {POSSESSION_STATUS.map(p => (
                  <Chip
                    key={p}
                    label={p}
                    selected={draft.possessionStatus === p}
                    onPress={() => set('possessionStatus', p as PossessionStatus)}
                  />
                ))}
              </View>
              <View style={{ height: 16 }} />
              <CustomTextInput
                label="RERA ID (optional)"
                placeholder="e.g. P51900012345"
                value={draft.reraId}
                onChangeText={v => set('reraId', v)}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text variant="h3" weight="700">Photos</Text>
              <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, marginBottom: 18 }}>
                Add up to 10 photos. First photo will be the cover.
              </Text>

              {/* Camera + Gallery buttons */}
              <View style={styles.pickRow}>
                <Pressable
                  onPress={takePhoto}
                  style={[
                    styles.pickBtn,
                    { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                  ]}
                >
                  <View style={[styles.pickIcon, { backgroundColor: theme.colors.primary + '14' }]}>
                    <Icon name="camera" size={22} color={theme.colors.primary} />
                  </View>
                  <Text weight="700" style={{ marginTop: 8 }}>Take Photo</Text>
                  <Text variant="caption" color="textMuted">Use camera</Text>
                </Pressable>
                <Pressable
                  onPress={pickFromGallery}
                  style={[
                    styles.pickBtn,
                    { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                  ]}
                >
                  <View style={[styles.pickIcon, { backgroundColor: theme.colors.accent + '22' }]}>
                    <Icon name="images" size={22} color={theme.colors.accentDark} />
                  </View>
                  <Text weight="700" style={{ marginTop: 8 }}>From Gallery</Text>
                  <Text variant="caption" color="textMuted">Pick existing</Text>
                </Pressable>
              </View>

              {/* Thumbnails of picked images */}
              {draft.images.length > 0 && (
                <View style={{ marginTop: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text variant="bodySm" weight="700">Selected</Text>
                    <View style={[styles.countPill, { backgroundColor: theme.colors.primary + '14' }]}>
                      <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
                        {draft.images.length}/10
                      </Text>
                    </View>
                  </View>
                  <View style={styles.imageGrid}>
                    {draft.images.map((uri, i) => (
                      <View key={`${uri}-${i}`} style={[styles.imageCell, { borderColor: theme.colors.border, borderWidth: 1 }]}>
                        <Image source={{ uri }} style={styles.image} />
                        {i === 0 && (
                          <View style={[styles.coverBadge, { backgroundColor: theme.colors.accent }]}>
                            <Icon name="star" size={10} color="#fff" />
                            <Text variant="caption" weight="800" style={{ color: '#fff', marginLeft: 3, fontSize: 9 }}>
                              COVER
                            </Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() => removeImage(uri)}
                          hitSlop={8}
                          style={[styles.removeBtn, { backgroundColor: theme.colors.error }]}
                        >
                          <Icon name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Stock library fallback */}
              <View style={{ marginTop: 22 }}>
                <View style={styles.stockHeader}>
                  <Text variant="bodySm" weight="700" color="textSecondary">
                    Or use stock photos
                  </Text>
                  <Text variant="caption" color="textMuted">
                    Demo only
                  </Text>
                </View>
                <View style={styles.imageGrid}>
                  {STOCK_IMAGES.map(uri => {
                    const selected = draft.images.includes(uri);
                    return (
                      <Pressable
                        key={uri}
                        onPress={() => toggle('images', uri)}
                        style={[
                          styles.imageCell,
                          {
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                            borderWidth: selected ? 3 : 1,
                          },
                        ]}
                      >
                        <Image source={{ uri }} style={styles.image} />
                        {selected && (
                          <View style={[styles.imageBadge, { backgroundColor: theme.colors.primary }]}>
                            <Icon name="checkmark" size={14} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {draft.images.length === 0 && (
                <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 18 }}>
                  No photos yet — add at least one to continue.
                </Text>
              )}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text variant="h3" weight="700">Amenities</Text>
              <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, marginBottom: 18 }}>
                Help buyers shortlist faster.
              </Text>
              <View style={styles.wrap}>
                {ALL_AMENITIES.map(a => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    iconName={a.iconName}
                    selected={draft.amenityIds.includes(a.id)}
                    onPress={() => toggle('amenityIds', a.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text variant="h3" weight="700">Review & Publish</Text>
              <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, marginBottom: 18 }}>
                Looks good? Publish to start receiving inquiries.
              </Text>
              <Card>
                <Text variant="bodyLg" weight="700">{draft.title || '(no title)'}</Text>
                <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                  {draft.locality}, {draft.city}
                </Text>
                <View style={{ height: 12 }} />
                <ReviewRow label="Type" value={PROPERTY_TYPES.find(t => t.id === draft.type)?.label ?? draft.type} />
                <ReviewRow label="Configuration" value={draft.configuration.join(', ') || '—'} />
                <ReviewRow label="Area" value={draft.areaMin > 0 ? `${draft.areaMin} sq.ft` : '—'} />
                <ReviewRow label="Price" value={draft.priceMin > 0 ? `₹${draft.priceMin.toLocaleString('en-IN')}` : '—'} />
                <ReviewRow label="Possession" value={draft.possessionStatus} />
                <ReviewRow label="Photos" value={`${draft.images.length} selected`} />
                <ReviewRow label="Amenities" value={`${draft.amenityIds.length} selected`} />
              </Card>
              {overQuota && (
                <Card
                  style={{
                    marginTop: 14,
                    backgroundColor: theme.colors.warning + '14',
                    borderColor: theme.colors.warning + '40',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="alert-circle" size={20} color={theme.colors.warning} />
                    <Text weight="700" style={{ marginLeft: 8, flex: 1 }}>
                      Listing limit reached
                    </Text>
                  </View>
                  <Text variant="bodySm" color="textSecondary" style={{ marginTop: 6 }}>
                    Your {seller?.plan} plan allows {seller?.listingQuotaTotal} listings. Upgrade to post more.
                  </Text>
                  <View style={{ height: 12 }} />
                  <GradientButton
                    title="Upgrade Plan"
                    iconName="rocket-outline"
                    iconPosition="left"
                    onPress={() => navigation.navigate('Plans')}
                  />
                </Card>
              )}
            </View>
          )}
      </KeyboardScreen>

      {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={[
              styles.fabBack,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
        )}

        {step < STEPS.length - 1 ? (
          <Pressable onPress={next} style={[styles.fabNext, { backgroundColor: theme.colors.primary }]}>
            <Icon name="arrow-forward" size={24} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={overQuota ? () => navigation.navigate('Plans') : submit}
            disabled={submitting}
            style={[
              styles.fabPublish,
              {
                backgroundColor: overQuota ? theme.colors.accent : theme.colors.primary,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
          >
            <Icon
              name={overQuota ? 'rocket' : submitting ? 'hourglass-outline' : 'checkmark'}
              size={20}
              color="#fff"
            />
            <Text weight="700" style={{ color: '#fff', marginLeft: 8, fontSize: 15 }}>
              {overQuota ? 'Upgrade' : submitting ? 'Publishing…' : 'Publish'}
            </Text>
          </Pressable>
        )}
    </Screen>
  );
};

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
    <Text variant="bodySm" color="textMuted">{label}</Text>
    <Text variant="bodySm" weight="700" style={{ flex: 1, textAlign: 'right', marginLeft: 12 }} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    height: 2,
    flex: 1,
    marginTop: 12,
    marginHorizontal: -8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageCell: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickBtn: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  pickIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fabBack: {
    position: 'absolute',
    left: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  fabNext: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 12,
  },
  fabPublish: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 12,
  },
});

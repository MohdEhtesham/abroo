import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Chip,
  GradientButton,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { BHK_OPTIONS, BUDGET_RANGES, POSSESSION_STATUS, PROPERTY_TYPES } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  clearRecentLocations,
  loadListThunk,
  setFilters,
  setLocation,
} from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';
import { ALL_AMENITIES } from '../mockData/amenities';
import type { PossessionStatus, PropertyType } from '../types';
import { LocationPicker } from '../../location/components/LocationPicker';
import type { LocationSearchResult } from '../../location/services/locationService';

export const FiltersScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const current = useAppSelector(s => s.property.filters);

  const selectedLocation = useAppSelector(s => s.property.selectedLocation);
  const recentLocations = useAppSelector(s => s.property.recentLocations);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [types, setTypes] = useState<PropertyType[]>(current.types ?? []);
  const [bhk, setBhk] = useState<string[]>(current.bhk ?? []);
  const [budget, setBudget] = useState<{ min?: number; max?: number }>({ min: current.budgetMin, max: current.budgetMax });
  const [possession, setPossession] = useState<PossessionStatus[]>(current.possessionStatus ?? []);
  const [amenities, setAmenities] = useState<string[]>(current.amenities ?? []);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter(x => x !== value) : [...list, value];

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

  const apply = () => {
    const filters = {
      city: selectedLocation?.city,
      locality: selectedLocation?.locality,
      types: types.length ? types : undefined,
      bhk: bhk.length ? bhk : undefined,
      budgetMin: budget.min,
      budgetMax: budget.max,
      possessionStatus: possession.length ? possession : undefined,
      amenities: amenities.length ? amenities : undefined,
    };
    dispatch(setFilters(filters));
    dispatch(loadListThunk({ filters, page: 1, refresh: true }));
    navigation.goBack();
  };

  const reset = () => {
    dispatch(setLocation(null));
    setTypes([]);
    setBhk([]);
    setBudget({});
    setPossession([]);
    setAmenities([]);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AnimatedHeader
        title="Filters"
        onBackPress={() => navigation.goBack()}
        rightLabel="Reset"
        onRightPress={reset}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Location" style={{ paddingHorizontal: 0 }} />
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[
            styles.locationRow,
            { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.locationIcon, { backgroundColor: theme.colors.primary + '14' }]}>
            <Icon name="location" size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            {selectedLocation ? (
              <>
                <Text variant="body" weight="700" numberOfLines={1}>
                  {selectedLocation.locality
                    ? `${selectedLocation.locality}, ${selectedLocation.city}`
                    : selectedLocation.city}
                </Text>
                {!!selectedLocation.secondary && (
                  <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 1 }}>
                    {selectedLocation.secondary}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text variant="body" weight="700">
                  Search any location in India
                </Text>
                <Text variant="caption" color="textMuted" style={{ marginTop: 1 }}>
                  City, suburb or area
                </Text>
              </>
            )}
          </View>
          <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
            {selectedLocation ? 'Change' : 'Choose'}
          </Text>
        </Pressable>

        <SectionHeader title="Property type" style={{ paddingHorizontal: 0, marginTop: 18 }} />
        <View style={styles.wrap}>
          {PROPERTY_TYPES.map(t => (
            <Chip
              key={t.id}
              label={t.label}
              iconName={t.icon}
              selected={types.includes(t.id as PropertyType)}
              onPress={() => setTypes(prev => toggle(prev, t.id as PropertyType))}
            />
          ))}
        </View>

        <SectionHeader title="Configuration (BHK)" style={{ paddingHorizontal: 0, marginTop: 18 }} />
        <View style={styles.wrap}>
          {BHK_OPTIONS.map(b => (
            <Chip
              key={b}
              label={b}
              selected={bhk.includes(b)}
              onPress={() => setBhk(prev => toggle(prev, b))}
            />
          ))}
        </View>

        <SectionHeader title="Budget" style={{ paddingHorizontal: 0, marginTop: 18 }} />
        <View style={styles.wrap}>
          {BUDGET_RANGES.map(r => {
            const active = budget.min === r.min && budget.max === r.max;
            return (
              <Pressable
                key={r.id}
                onPress={() => setBudget(active ? {} : { min: r.min, max: r.max })}
                style={[
                  styles.budget,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text weight="600" style={{ color: active ? '#fff' : theme.colors.text }}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title="Possession status" style={{ paddingHorizontal: 0, marginTop: 18 }} />
        <View style={styles.wrap}>
          {POSSESSION_STATUS.map(p => (
            <Chip
              key={p}
              label={p}
              selected={possession.includes(p as PossessionStatus)}
              onPress={() => setPossession(prev => toggle(prev, p as PossessionStatus))}
            />
          ))}
        </View>

        <SectionHeader title="Amenities" style={{ paddingHorizontal: 0, marginTop: 18 }} />
        <View style={styles.wrap}>
          {ALL_AMENITIES.map(a => (
            <Chip
              key={a.id}
              label={a.name}
              iconName={a.iconName}
              selected={amenities.includes(a.id)}
              onPress={() => setAmenities(prev => toggle(prev, a.id))}
            />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <GradientButton title="Apply Filters" onPress={apply} size="lg" />
      </View>

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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budget: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AnimatedHeader,
  Chip,
  GradientButton,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { BHK_OPTIONS, BUDGET_RANGES, CITIES, POSSESSION_STATUS, PROPERTY_TYPES } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loadListThunk, setFilters } from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';
import { ALL_AMENITIES } from '../mockData/amenities';
import type { PossessionStatus, PropertyType } from '../types';

export const FiltersScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const current = useAppSelector(s => s.property.filters);

  const [city, setCity] = useState(current.city);
  const [types, setTypes] = useState<PropertyType[]>(current.types ?? []);
  const [bhk, setBhk] = useState<string[]>(current.bhk ?? []);
  const [budget, setBudget] = useState<{ min?: number; max?: number }>({ min: current.budgetMin, max: current.budgetMax });
  const [possession, setPossession] = useState<PossessionStatus[]>(current.possessionStatus ?? []);
  const [amenities, setAmenities] = useState<string[]>(current.amenities ?? []);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter(x => x !== value) : [...list, value];

  const apply = () => {
    const filters = {
      city,
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
    setCity(undefined);
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
        <SectionHeader title="City" style={{ paddingHorizontal: 0 }} />
        <View style={styles.wrap}>
          {CITIES.map(c => (
            <Chip key={c} label={c} selected={city === c} onPress={() => setCity(city === c ? undefined : c)} />
          ))}
        </View>

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
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  AnimatedHeader,
  Chip,
  GradientButton,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { BHK_OPTIONS, BUDGET_RANGES, CITIES, PROPERTY_TYPES } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setPreferences } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';

export const PreferencesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const prefs = useAppSelector(s => s.auth.user?.preferences);

  const [cities, setCities] = useState<string[]>(prefs?.preferredCities ?? []);
  const [types, setTypes] = useState<string[]>(prefs?.preferredTypes ?? []);
  const [configs, setConfigs] = useState<string[]>(prefs?.preferredConfigs ?? []);
  const [budget, setBudget] = useState<{ min: number; max: number }>({
    min: prefs?.budgetMin ?? 0,
    max: prefs?.budgetMax ?? 50000000,
  });

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter(x => x !== v) : [...list, v];

  const save = () => {
    dispatch(
      setPreferences({
        budgetMin: budget.min,
        budgetMax: budget.max,
        preferredCities: cities,
        preferredTypes: types,
        preferredConfigs: configs,
        notificationsEnabled: true,
      }),
    );
    Alert.alert('Saved!', 'Your preferences have been updated.');
    navigation.goBack();
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Preferences" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <Text variant="body" color="textSecondary" style={{ marginTop: 4 }}>
          Tell us what you're looking for and we'll personalize your recommendations.
        </Text>

        <SectionHeader title="Preferred cities" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <View style={styles.wrap}>
          {CITIES.map(c => (
            <Chip key={c} label={c} selected={cities.includes(c)} onPress={() => setCities(toggle(cities, c))} />
          ))}
        </View>

        <SectionHeader title="Property types" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <View style={styles.wrap}>
          {PROPERTY_TYPES.map(t => (
            <Chip
              key={t.id}
              label={t.label}
              iconName={t.icon}
              selected={types.includes(t.id)}
              onPress={() => setTypes(toggle(types, t.id))}
            />
          ))}
        </View>

        <SectionHeader title="Preferred configurations" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <View style={styles.wrap}>
          {BHK_OPTIONS.map(b => (
            <Chip key={b} label={b} selected={configs.includes(b)} onPress={() => setConfigs(toggle(configs, b))} />
          ))}
        </View>

        <SectionHeader title="Budget" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <View style={styles.wrap}>
          {BUDGET_RANGES.map(r => {
            const active = budget.min === r.min && budget.max === r.max;
            return (
              <Chip
                key={r.id}
                label={r.label}
                selected={active}
                onPress={() => setBudget({ min: r.min, max: r.max })}
              />
            );
          })}
        </View>

        <View style={{ marginTop: 30 }}>
          <GradientButton title="Save Preferences" onPress={save} size="lg" />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

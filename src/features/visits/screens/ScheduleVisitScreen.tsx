import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  GradientButton,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { useAppDispatch } from '../../../store';
import { scheduleVisitThunk } from '../../../store/slices/visitSlice';
import { useTheme } from '../../../theme';
import { formatDate } from '../../../utils/format';
import { propertyService } from '../../property/services/propertyService';
import type { Property } from '../../property/types';
import { visitService } from '../services/visitService';
import type { VisitMode } from '../types';

const buildDays = (count: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
};

export const ScheduleVisitScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const propertyId = route.params?.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<VisitMode>('in_person');
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => buildDays(14), []);

  useEffect(() => {
    if (propertyId) propertyService.detail(propertyId).then(setProperty);
    visitService.slots().then(setSlots);
  }, [propertyId]);

  const onConfirm = async () => {
    if (!property || !selectedDate || !selectedSlot) {
      Alert.alert('Incomplete', 'Please pick a date and time slot.');
      return;
    }
    setSubmitting(true);
    const action = await dispatch(
      scheduleVisitThunk({
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImage: property.images[0],
        propertyLocation: `${property.locality}, ${property.city}`,
        date: selectedDate.toISOString(),
        timeSlot: selectedSlot,
        mode,
      }),
    );
    setSubmitting(false);
    if (scheduleVisitThunk.fulfilled.match(action)) {
      Alert.alert('Visit booked!', 'Your site visit has been scheduled. We will send a reminder.', [
        { text: 'View Visits', onPress: () => navigation.navigate('UpcomingVisits') },
        { text: 'Done', style: 'cancel', onPress: () => navigation.popToTop() },
      ]);
    }
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Schedule Visit" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        {property && (
          <Card padding={12}>
            <View style={{ flexDirection: 'row' }}>
              <Image source={{ uri: property.images[0] }} style={styles.image} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="bodyLg" weight="700" numberOfLines={1}>{property.title}</Text>
                <Text variant="caption" color="textMuted" style={{ marginTop: 2 }} numberOfLines={1}>
                  {property.locality}, {property.city}
                </Text>
                <View style={[styles.row, { marginTop: 8 }]}>
                  <Icon name="business-outline" size={13} color={theme.colors.textMuted} />
                  <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                    {property.builder}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        <SectionHeader title="Visit mode" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(
            [
              { value: 'in_person', label: 'In Person', icon: 'walk-outline' },
              { value: 'virtual', label: 'Virtual Tour', icon: 'videocam-outline' },
            ] as const
          ).map(opt => {
            const active = mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: active ? theme.colors.primary + '12' : theme.colors.surfaceElevated,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Icon name={opt.icon as any} size={22} color={active ? theme.colors.primary : theme.colors.textMuted} />
                <Text weight="700" style={{ marginTop: 6, color: active ? theme.colors.primary : theme.colors.text }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title="Pick a date" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {days.map(d => {
            const sel = selectedDate?.toDateString() === d.toDateString();
            const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setSelectedDate(d)}
                style={[
                  styles.dateCard,
                  {
                    backgroundColor: sel ? theme.colors.primary : theme.colors.surfaceElevated,
                    borderColor: sel ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text variant="caption" weight="600" style={{ color: sel ? '#fff' : theme.colors.textMuted }}>
                  {dayName.toUpperCase()}
                </Text>
                <Text variant="h3" weight="800" style={{ color: sel ? '#fff' : theme.colors.text, marginTop: 2 }}>
                  {d.getDate()}
                </Text>
                <Text variant="caption" weight="600" style={{ color: sel ? 'rgba(255,255,255,0.8)' : theme.colors.textMuted }}>
                  {d.toLocaleDateString('en-IN', { month: 'short' })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeader title="Pick a time slot" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <View style={styles.slotGrid}>
          {slots.map(s => {
            const sel = selectedSlot === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSelectedSlot(s)}
                style={[
                  styles.slot,
                  {
                    backgroundColor: sel ? theme.colors.primary : theme.colors.surfaceElevated,
                    borderColor: sel ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text weight="600" style={{ color: sel ? '#fff' : theme.colors.text, fontSize: 13 }}>
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedDate && selectedSlot && (
          <Card style={{ marginTop: 22, backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '30' }}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <View>
                <Text variant="caption" color="textMuted">Your visit</Text>
                <Text variant="bodyLg" weight="700" style={{ marginTop: 4 }}>
                  {formatDate(selectedDate.toISOString())} • {selectedSlot}
                </Text>
              </View>
              <Icon name="checkmark-circle" size={28} color={theme.colors.success} />
            </View>
          </Card>
        )}

        <View style={{ marginTop: 22 }}>
          <GradientButton title="Confirm Visit" loading={submitting} onPress={onConfirm} size="lg" />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeCard: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dateCard: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
});

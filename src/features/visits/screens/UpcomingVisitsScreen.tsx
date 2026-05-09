import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  EmptyState,
  Screen,
  SkeletonLoader,
  StatusBadge,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { cancelVisitThunk, loadVisitsThunk } from '../../../store/slices/visitSlice';
import { useTheme } from '../../../theme';
import { formatDate, formatTime } from '../../../utils/format';
import type { Visit, VisitStatus } from '../types';

const TABS: Array<{ id: 'all' | VisitStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const statusTone = (s: VisitStatus): 'info' | 'success' | 'error' | 'warning' => {
  switch (s) {
    case 'upcoming':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'rescheduled':
      return 'warning';
  }
};

export const UpcomingVisitsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector(s => s.visit);

  const [tab, setTab] = useState<'all' | VisitStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadVisitsThunk());
  }, [dispatch]);

  const filtered = useMemo(() => {
    if (tab === 'all') return list;
    return list.filter(v => v.status === tab);
  }, [list, tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadVisitsThunk());
    setRefreshing(false);
  };

  const onCancel = (v: Visit) => {
    Alert.alert('Cancel Visit?', 'This action cannot be undone.', [
      { text: 'Keep visit', style: 'cancel' },
      {
        text: 'Cancel visit',
        style: 'destructive',
        onPress: () => dispatch(cancelVisitThunk(v.id)),
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title="My Visits"
        showBack={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.tabs}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text variant="bodySm" weight="700" style={{ color: active ? '#fff' : theme.colors.text }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && list.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2].map(i => (
            <View key={i} style={{ marginBottom: 14 }}>
              <SkeletonLoader height={140} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => (
            <Card padding={14} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row' }}>
                <Image source={{ uri: item.propertyImage }} style={styles.image} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyLg" weight="700" numberOfLines={1} style={{ flex: 1 }}>
                      {item.propertyTitle}
                    </Text>
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  </View>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 2 }} numberOfLines={1}>
                    {item.propertyLocation}
                  </Text>
                </View>
              </View>
              <View style={[styles.metaRow, { borderTopColor: theme.colors.divider }]}>
                <View style={[styles.metaCell, { borderRightColor: theme.colors.divider }]}>
                  <Icon name="calendar-outline" size={14} color={theme.colors.primary} />
                  <Text variant="caption" weight="700" style={{ marginTop: 4 }}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <View style={[styles.metaCell, { borderRightColor: theme.colors.divider }]}>
                  <Icon name="time-outline" size={14} color={theme.colors.primary} />
                  <Text variant="caption" weight="700" style={{ marginTop: 4 }} numberOfLines={1}>
                    {item.timeSlot}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Icon
                    name={item.mode === 'virtual' ? 'videocam-outline' : 'walk-outline'}
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text variant="caption" weight="700" style={{ marginTop: 4 }}>
                    {item.mode === 'virtual' ? 'Virtual' : 'In Person'}
                  </Text>
                </View>
              </View>
              {item.status === 'upcoming' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {item.mode === 'virtual' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
                      onPress={() =>
                        navigation.navigate('VideoCall', {
                          visitId: item.id,
                          propertyTitle: item.propertyTitle,
                        })
                      }
                    >
                      <Text variant="bodySm" weight="700" style={{ color: '#fff' }}>
                        Join virtual tour
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '14' }]}
                    onPress={() =>
                      navigation.navigate('ScheduleVisit', { propertyId: item.propertyId })
                    }
                  >
                    <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>
                      Reschedule
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: theme.colors.error + '14' }]}
                    onPress={() => onCancel(item)}
                  >
                    <Text variant="bodySm" weight="700" style={{ color: theme.colors.error }}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                iconName="calendar-outline"
                title="No visits yet"
                message="Book site visits from any property page and they'll appear here."
                actionLabel="Browse Properties"
                onActionPress={() => navigation.navigate('HomeStack')}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaCell: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
});

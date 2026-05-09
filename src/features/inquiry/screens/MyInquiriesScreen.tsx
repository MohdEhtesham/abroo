import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
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
import { loadInquiriesThunk } from '../../../store/slices/inquirySlice';
import { useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';
import { statusMeta } from '../utils/status';

export const MyInquiriesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector(s => s.inquiry);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadInquiriesThunk());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadInquiriesThunk());
    setRefreshing(false);
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="My Inquiries" showBack={false} />
      {loading && list.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ marginBottom: 14 }}>
              <SkeletonLoader height={120} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => {
            const meta = statusMeta(item.status);
            return (
              <Pressable onPress={() => navigation.navigate('InquiryDetail', { id: item.id })}>
                <Card padding={14} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={{ uri: item.propertyImage }} style={styles.image} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="bodyLg" weight="700" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                          {item.propertyTitle}
                        </Text>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </View>
                      <Text variant="caption" color="textMuted" style={{ marginTop: 2 }} numberOfLines={1}>
                        {item.propertyLocation}
                      </Text>
                      {item.advisorName && (
                        <View style={[styles.row, { marginTop: 10 }]}>
                          <Icon name="person-circle-outline" size={16} color={theme.colors.textMuted} />
                          <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                            {item.advisorName}
                          </Text>
                          <View style={{ flex: 1 }} />
                          <Text variant="caption" color="textMuted">
                            {timeAgo(item.updatedAt)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                iconName="document-text-outline"
                title="No inquiries yet"
                message="Submit an inquiry on any property and track its progress here."
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import {
  AnimatedHeader,
  EmptyState,
  PropertyCard,
  PropertyCardSkeleton,
  Screen,
  SearchBar,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loadListThunk, setFilters, toggleSaved } from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';
import type { PropertyType } from '../types';

export const PropertyListScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { list, loading, page, hasMore, saved, filters } = useAppSelector(s => s.property);
  const titleParam = route.params?.title as string | undefined;
  const typeParam = route.params?.type as PropertyType | undefined;

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const f = { ...filters };
    if (typeParam) f.types = [typeParam];
    dispatch(setFilters(f));
    dispatch(loadListThunk({ filters: f, page: 1, refresh: true }));
  }, [dispatch, typeParam]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadListThunk({ filters, page: 1, refresh: true }));
    setRefreshing(false);
  };

  const onEnd = () => {
    if (loading || !hasMore) return;
    dispatch(loadListThunk({ filters, page: page + 1 }));
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader
        title={titleParam ?? 'Properties'}
        onBackPress={() => navigation.goBack()}
        rightIcon="options-outline"
        onRightPress={() => navigation.navigate('Filters')}
      />
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <SearchBar onPress={() => navigation.navigate('Search')} editable={false} showFilter={false} />
      </View>
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            variant="wide"
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
            onSavePress={() => dispatch(toggleSaved(item.id))}
            saved={saved.includes(item.id)}
            style={{ marginBottom: 16 }}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        onEndReached={onEnd}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          loading && page === 1 ? (
            <View>
              {[1, 2, 3].map(i => (
                <PropertyCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              iconName="home-outline"
              title="No properties found"
              message="Try adjusting your filters or search again."
              actionLabel="Reset Filters"
              onActionPress={() => {
                dispatch(setFilters({}));
                dispatch(loadListThunk({ filters: {}, page: 1, refresh: true }));
              }}
            />
          )
        }
      />
    </Screen>
  );
};

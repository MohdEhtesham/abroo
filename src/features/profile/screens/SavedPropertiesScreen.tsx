import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import {
  AnimatedHeader,
  EmptyState,
  PropertyCard,
  Screen,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { toggleSaved } from '../../../store/slices/propertySlice';
import { propertyService } from '../../property/services/propertyService';
import type { Property } from '../../property/types';

export const SavedPropertiesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const saved = useAppSelector(s => s.property.saved);
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    Promise.all(saved.map(id => propertyService.detail(id))).then(rs =>
      setItems(rs.filter((x): x is Property => !!x)),
    );
  }, [saved]);

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Saved Properties" onBackPress={() => navigation.goBack()} />
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            variant="wide"
            saved
            onSavePress={() => dispatch(toggleSaved(item.id))}
            onPress={() =>
              navigation.navigate('PropertyStack', { screen: 'PropertyDetail', params: { id: item.id } })
            }
            style={{ marginBottom: 16 }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            iconName="heart-outline"
            title="No saved properties"
            message="Tap the heart icon on any property to save it here."
            actionLabel="Browse Properties"
            onActionPress={() => navigation.navigate('HomeStack')}
          />
        }
      />
    </Screen>
  );
};

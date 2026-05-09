import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  FiltersScreen,
  MapViewScreen,
  PropertyDetailScreen,
  PropertyListScreen,
  SearchScreen,
} from '../features/property/screens';
import type { PropertyStackParamList } from './types';

const Stack = createNativeStackNavigator<PropertyStackParamList>();

export const PropertyNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="PropertyList" component={PropertyListScreen} />
    <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen
      name="Filters"
      component={FiltersScreen}
      options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
    />
    <Stack.Screen name="MapView" component={MapViewScreen} />
  </Stack.Navigator>
);

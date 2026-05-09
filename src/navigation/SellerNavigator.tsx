import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  AddListingScreen,
  LeadsScreen,
  MyListingsScreen,
  PlansScreen,
  SellerAnalyticsScreen,
  SellerHomeScreen,
} from '../features/seller/screens';

export type SellerStackParamList = {
  SellerHome: undefined;
  MyListings: undefined;
  AddListing: undefined;
  Leads: { initialTab?: 'all' | 'new' | 'contacted' | 'visit_booked' | 'closed_won' | 'closed_lost' } | undefined;
  Analytics: undefined;
  Plans: undefined;
};

const Stack = createNativeStackNavigator<SellerStackParamList>();

export const SellerHomeNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="SellerHome" component={SellerHomeScreen} />
    <Stack.Screen name="AddListing" component={AddListingScreen} />
    <Stack.Screen name="MyListings" component={MyListingsScreen} />
    <Stack.Screen name="Leads" component={LeadsScreen} />
    <Stack.Screen name="Analytics" component={SellerAnalyticsScreen} />
    <Stack.Screen name="Plans" component={PlansScreen} />
  </Stack.Navigator>
);

export const SellerListingsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="MyListings" component={MyListingsScreen} />
    <Stack.Screen name="AddListing" component={AddListingScreen} />
    <Stack.Screen name="Plans" component={PlansScreen} />
  </Stack.Navigator>
);

export const SellerLeadsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Leads" component={LeadsScreen} />
  </Stack.Navigator>
);

export const SellerAnalyticsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Analytics" component={SellerAnalyticsScreen} />
    <Stack.Screen name="Plans" component={PlansScreen} />
  </Stack.Navigator>
);

export const SellerPlansNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Plans" component={PlansScreen} />
  </Stack.Navigator>
);

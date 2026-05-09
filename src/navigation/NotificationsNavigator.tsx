import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { NotificationsScreen } from '../features/notifications/screens';
import type { NotificationsStackParamList } from './types';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  ScheduleVisitScreen,
  UpcomingVisitsScreen,
} from '../features/visits/screens';
import type { VisitsStackParamList } from './types';

const Stack = createNativeStackNavigator<VisitsStackParamList>();

export const VisitsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="UpcomingVisits" component={UpcomingVisitsScreen} />
    <Stack.Screen name="ScheduleVisit" component={ScheduleVisitScreen} />
  </Stack.Navigator>
);

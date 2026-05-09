import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ChatScreen } from '../features/chat/screens';
import type { ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ChatScreen, ChatThreadsScreen } from '../features/chat/screens';
import type { ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatNavigator: React.FC<{ initialRouteName?: keyof ChatStackParamList }> = ({
  initialRouteName = 'ChatThreads',
}) => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    initialRouteName={initialRouteName}
  >
    <Stack.Screen name="ChatThreads" component={ChatThreadsScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

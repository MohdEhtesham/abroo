import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  EditProfileScreen,
  HelpSupportScreen,
  PreferencesScreen,
  ProfileScreen,
  SavedPropertiesScreen,
  SettingsScreen,
} from '../features/profile/screens';
import { VoiceLabScreen } from '../features/voiceLab/screens/VoiceLabScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="SavedProperties" component={SavedPropertiesScreen} />
    <Stack.Screen name="Preferences" component={PreferencesScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="VoiceLab" component={VoiceLabScreen} />
  </Stack.Navigator>
);

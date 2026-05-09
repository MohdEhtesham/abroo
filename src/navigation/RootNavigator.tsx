import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { SplashScreen } from '../features/auth/screens';
import { useAppSelector } from '../store';
import { useTheme } from '../theme';
import { storage } from '../utils/storage';
import { AuthNavigator } from './AuthNavigator';
import { BottomTabs } from './BottomTabs';
import { ChatNavigator } from './ChatNavigator';
import { InquiryNavigator } from './InquiryNavigator';
import { NotificationsNavigator } from './NotificationsNavigator';
import type { AuthStackParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const theme = useTheme();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const rehydrating = useAppSelector(s => (s.auth as any).rehydrating ?? false);
  const role = useAppSelector(s => s.auth.user?.role ?? 'consumer');
  const [splashDone, setSplashDone] = useState(false);
  const [authInitialRoute, setAuthInitialRoute] = useState<keyof AuthStackParamList | null>(null);

  useEffect(() => {
    let cancelled = false;
    storage
      .getOnboardingSeen()
      .then(seen => {
        if (!cancelled) setAuthInitialRoute(seen ? 'Login' : 'Onboarding');
      })
      .catch(() => {
        if (!cancelled) setAuthInitialRoute('Onboarding');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const navTheme: Theme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };

  // Hold splash while: animation playing, onboarding flag loading, OR auth rehydrating
  if (!splashDone || authInitialRoute === null || rehydrating) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  const AuthWrapped = () => <AuthNavigator initialRoute={authInitialRoute} />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthWrapped} />
        ) : (
          <>
            <Stack.Screen name="Main" component={BottomTabs} key={role} />
            <Stack.Screen
              name="ChatStack"
              component={ChatNavigator}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="NotificationsStack"
              component={NotificationsNavigator}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="InquiryStack"
              component={InquiryWrapped}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const InquiryWrapped: React.FC = () => <InquiryNavigator initialRouteName="InquiryForm" />;

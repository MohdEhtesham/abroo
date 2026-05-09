import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  ForgotPasswordScreen,
  LoginScreen,
  OnboardingScreen,
  OTPVerificationScreen,
  SignupScreen,
} from '../features/auth/screens';
import { storage } from '../utils/storage';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC<{ initialRoute?: keyof AuthStackParamList }> = ({
  initialRoute = 'Onboarding',
}) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName={initialRoute}>
    <Stack.Screen name="Onboarding">
      {props => (
        <OnboardingScreen
          onComplete={() => {
            storage.setOnboardingSeen();
            props.navigation.replace('Login');
          }}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

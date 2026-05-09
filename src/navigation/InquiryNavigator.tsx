import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  InquiryDetailScreen,
  InquiryFormScreen,
  InquirySuccessScreen,
  MyInquiriesScreen,
} from '../features/inquiry/screens';
import type { InquiryStackParamList } from './types';

const Stack = createNativeStackNavigator<InquiryStackParamList>();

export const InquiryNavigator: React.FC<{ initialRouteName?: keyof InquiryStackParamList }> = ({
  initialRouteName = 'MyInquiries',
}) => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    initialRouteName={initialRouteName}
  >
    <Stack.Screen name="MyInquiries" component={MyInquiriesScreen} />
    <Stack.Screen name="InquiryForm" component={InquiryFormScreen} />
    <Stack.Screen name="InquirySuccess" component={InquirySuccessScreen} options={{ animation: 'fade' }} />
    <Stack.Screen name="InquiryDetail" component={InquiryDetailScreen} />
  </Stack.Navigator>
);

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  OTPVerification: { phone: string };
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type PropertyStackParamList = {
  PropertyList: { type?: string; title?: string } | undefined;
  PropertyDetail: { id: string };
  Search: undefined;
  Filters: undefined;
  MapView: { id: string };
};

export type InquiryStackParamList = {
  MyInquiries: undefined;
  InquiryForm: { propertyId: string };
  InquirySuccess: { inquiryId: string };
  InquiryDetail: { id: string };
};

export type VisitsStackParamList = {
  UpcomingVisits: undefined;
  ScheduleVisit: { propertyId: string };
};

export type ChatStackParamList = {
  Chat: undefined;
};

export type NotificationsStackParamList = {
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  SavedProperties: undefined;
  Preferences: undefined;
  HelpSupport: undefined;
  Settings: undefined;
};

export type RootTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  PropertyStack: NavigatorScreenParams<PropertyStackParamList>;
  InquiriesStack: NavigatorScreenParams<InquiryStackParamList>;
  VisitsStack: NavigatorScreenParams<VisitsStackParamList>;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<RootTabParamList>;
  ChatStack: NavigatorScreenParams<ChatStackParamList>;
  NotificationsStack: NavigatorScreenParams<NotificationsStackParamList>;
  InquiryStack: NavigatorScreenParams<InquiryStackParamList>;
  VideoCall: { visitId: string; propertyTitle?: string };
};

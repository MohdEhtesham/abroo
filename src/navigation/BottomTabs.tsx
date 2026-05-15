import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components';
import { useAppSelector } from '../store';
import { useTheme } from '../theme';
import { ChatNavigator } from './ChatNavigator';
import { HomeNavigator } from './HomeNavigator';
import { InquiryNavigator } from './InquiryNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { PropertyNavigator } from './PropertyNavigator';
import {
  SellerAnalyticsNavigator,
  SellerHomeNavigator,
  SellerLeadsNavigator,
  SellerListingsNavigator,
} from './SellerNavigator';
import { VisitsNavigator } from './VisitsNavigator';

const Tab = createBottomTabNavigator();

interface TabDef {
  key: string;
  label: string;
  icon: string;
  iconActive: string;
  component: React.ComponentType<any>;
}

const CONSUMER_TABS: TabDef[] = [
  { key: 'HomeStack', label: 'Home', icon: 'home-outline', iconActive: 'home', component: HomeNavigator },
  { key: 'PropertyStack', label: 'Explore', icon: 'compass-outline', iconActive: 'compass', component: PropertyNavigator },
  { key: 'ChatsTab', label: 'Chats', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', component: ChatNavigator },
  { key: 'VisitsStack', label: 'Visits', icon: 'calendar-outline', iconActive: 'calendar', component: VisitsNavigator },
  { key: 'ProfileStack', label: 'Profile', icon: 'person-outline', iconActive: 'person', component: ProfileNavigator },
];

const SELLER_TABS: TabDef[] = [
  { key: 'SellerHomeTab', label: 'Home', icon: 'home-outline', iconActive: 'home', component: SellerHomeNavigator },
  { key: 'ListingsTab', label: 'Listings', icon: 'business-outline', iconActive: 'business', component: SellerListingsNavigator },
  { key: 'LeadsTab', label: 'Leads', icon: 'people-outline', iconActive: 'people', component: SellerLeadsNavigator },
  { key: 'ChatsTab', label: 'Chats', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', component: ChatNavigator },
  { key: 'ProfileStack', label: 'Profile', icon: 'person-outline', iconActive: 'person', component: ProfileNavigator },
];

const CustomTabBar: React.FC<BottomTabBarProps & { tabs: TabDef[] }> = ({
  state,
  navigation,
  tabs,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inquiryCount = useAppSelector(s => s.inquiry.list.filter(i => i.status !== 'closed').length);
  const visitCount = useAppSelector(s => s.visit.list.filter(v => v.status === 'upcoming').length);
  const newLeads = useAppSelector(
    s => s.seller.leads.filter(l => l.status === 'new' || l.status === 'visit_booked').length,
  );
  const chatUnread = useAppSelector(s =>
    s.chat.threads.reduce((sum, t) => sum + (t.unread ?? 0), 0),
  );

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const meta = tabs.find(t => t.key === route.name);
        if (!meta) return null;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as any);
          }
        };

        let badge = 0;
        if (meta.key === 'InquiriesStack') badge = inquiryCount;
        else if (meta.key === 'VisitsStack') badge = visitCount;
        else if (meta.key === 'LeadsTab') badge = newLeads;
        else if (meta.key === 'ChatsTab') badge = chatUnread;

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <View style={styles.tabInner}>
              <Icon
                name={(isFocused ? meta.iconActive : meta.icon) as any}
                size={22}
                color={isFocused ? theme.colors.primary : theme.colors.tabInactive}
              />
              {badge > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                  <Text variant="caption" weight="800" style={{ color: '#fff', fontSize: 9 }}>
                    {badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              variant="caption"
              weight={isFocused ? '700' : '500'}
              style={{
                color: isFocused ? theme.colors.primary : theme.colors.tabInactive,
                marginTop: 4,
                fontSize: 10.5,
              }}
            >
              {meta.label}
            </Text>
            {isFocused && <View style={[styles.indicator, { backgroundColor: theme.colors.primary }]} />}
          </Pressable>
        );
      })}
    </View>
  );
};

export const BottomTabs: React.FC = () => {
  const role = useAppSelector(s => s.auth.user?.role ?? 'consumer');
  const tabs = role === 'seller' ? SELLER_TABS : CONSUMER_TABS;

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} tabs={tabs} />}
    >
      {tabs.map(t => (
        <Tab.Screen key={t.key} name={t.key} component={t.component} />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    borderRadius: 2,
  },
});

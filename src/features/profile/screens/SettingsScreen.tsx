import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AnimatedHeader, Card, Screen, SectionHeader, Text } from '../../../components';
import { useTheme, useThemeMode } from '../../../theme';

interface ToggleRow {
  id: string;
  label: string;
  description?: string;
  icon: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { mode, setMode } = useThemeMode();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const themeRows: ToggleRow[] = [
    {
      id: 'dark',
      label: 'Dark mode',
      description: 'Switch to a dark color scheme',
      icon: 'moon-outline',
      value: theme.mode === 'dark',
      onChange: v => setMode(v ? 'dark' : 'light'),
    },
    {
      id: 'system',
      label: 'Follow system',
      description: 'Match your device appearance',
      icon: 'phone-portrait-outline',
      value: mode === 'system',
      onChange: v => setMode(v ? 'system' : theme.mode),
    },
  ];

  const notifRows: ToggleRow[] = [
    {
      id: 'push',
      label: 'Push notifications',
      icon: 'notifications-outline',
      value: pushEnabled,
      onChange: setPushEnabled,
    },
    {
      id: 'email',
      label: 'Email updates',
      icon: 'mail-outline',
      value: emailEnabled,
      onChange: setEmailEnabled,
    },
    {
      id: 'sms',
      label: 'SMS alerts',
      icon: 'chatbubble-ellipses-outline',
      value: smsEnabled,
      onChange: setSmsEnabled,
    },
    {
      id: 'marketing',
      label: 'Marketing offers',
      description: 'Promotions, new launches',
      icon: 'megaphone-outline',
      value: marketing,
      onChange: setMarketing,
    },
  ];

  const renderRow = (row: ToggleRow, last: boolean) => (
    <View
      key={row.id}
      style={[
        styles.row,
        !last && { borderBottomColor: theme.colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.primary + '14' }]}>
        <Icon name={row.icon as any} size={20} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyLg" weight="600">{row.label}</Text>
        {row.description && (
          <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
            {row.description}
          </Text>
        )}
      </View>
      <Switch
        value={row.value}
        onValueChange={row.onChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Settings" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <SectionHeader title="Appearance" style={{ paddingHorizontal: 0 }} />
        <Card padding={0}>{themeRows.map((r, i) => renderRow(r, i === themeRows.length - 1))}</Card>

        <SectionHeader title="Notifications" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <Card padding={0}>{notifRows.map((r, i) => renderRow(r, i === notifRows.length - 1))}</Card>

        <SectionHeader title="About" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <Card>
          <Text variant="bodyLg" weight="700">Aabroo</Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>Version 1.0.0 (Build 100)</Text>
          <Text variant="bodySm" color="textSecondary" style={{ marginTop: 12 }}>
            By Aabroo
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});

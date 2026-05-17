import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Avatar,
  BottomSheet,
  Card,
  CountUp,
  GradientButton,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store';
import { deleteAccountThunk, logoutThunk } from '../../../store/slices/authSlice';
import { loadInquiriesThunk } from '../../../store/slices/inquirySlice';
import { loadSavedThunk } from '../../../store/slices/propertySlice';
import {
  loadAnalyticsThunk,
  loadLeadsThunk,
  loadListingsThunk,
  loadSellerVisitsThunk,
} from '../../../store/slices/sellerSlice';
import { loadVisitsThunk } from '../../../store/slices/visitSlice';
import { useTheme, useThemeMode } from '../../../theme';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  tone?: 'default' | 'danger';
  onPress?: () => void;
}

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const inquiriesCount = useAppSelector(s => s.inquiry.list.length);
  const visitsCount = useAppSelector(s => s.visit.list.length);
  const savedCount = useAppSelector(s => s.property.saved.length);
  const listingsCount = useAppSelector(s => s.seller.listings.length);
  const leadsCount = useAppSelector(s => s.seller.leads.length);
  const sellerViews = useAppSelector(s => s.seller.analytics?.totalViews ?? 0);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isSeller = user?.role === 'seller';

  // Refresh stat counts from the API every time Profile is focused so they
  // reflect server state on fresh logins / after creating items elsewhere.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      if (isSeller) {
        dispatch(loadListingsThunk());
        dispatch(loadLeadsThunk());
        dispatch(loadAnalyticsThunk());
        dispatch(loadSellerVisitsThunk());
      } else {
        dispatch(loadInquiriesThunk());
        dispatch(loadVisitsThunk());
        dispatch(loadSavedThunk());
      }
    }, [dispatch, user, isSeller]),
  );

  const consumerAccountItems: MenuItem[] = [
    { id: 'edit', label: 'Edit Profile', icon: 'person-outline', route: 'EditProfile' },
    { id: 'saved', label: 'Saved Properties', icon: 'heart-outline', route: 'SavedProperties' },
    { id: 'pref', label: 'Requirement Preferences', icon: 'sparkles-outline', route: 'Preferences' },
  ];

  const sellerAccountItems: MenuItem[] = [
    { id: 'edit', label: 'Edit Profile', icon: 'person-outline', route: 'EditProfile' },
  ];

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: isSeller ? sellerAccountItems : consumerAccountItems,
    },
    {
      title: 'Tools',
      items: [
        { id: 'voiceLab', label: 'Voice Lab', icon: 'mic-outline', route: 'VoiceLab' },
      ],
    },
    {
      title: 'App',
      items: [
        { id: 'settings', label: 'Settings', icon: 'settings-outline', route: 'Settings' },
        { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: 'HelpSupport' },
      ],
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          label: 'Log Out',
          icon: 'log-out-outline',
          tone: 'danger',
          onPress: () => setLogoutOpen(true),
        },
        {
          id: 'delete',
          label: 'Delete Account',
          icon: 'trash-outline',
          tone: 'danger',
          onPress: () => setDeleteOpen(true),
        },
      ],
    },
  ];

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.hero}
        >
          <Pressable
            style={styles.themeBtn}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          >
            <Icon name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color="#fff" />
          </Pressable>
          <View style={styles.heroContent}>
            <Avatar name={user?.fullName ?? 'Guest'} uri={user?.avatar} size={84} inverse />
            <Text variant="h2" weight="800" style={{ color: '#fff', marginTop: 14 }}>
              {user?.fullName ?? 'Guest User'}
            </Text>
            <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {user?.email}
            </Text>
            {user?.city && (
              <View style={[styles.row, { marginTop: 8 }]}>
                <Icon name="location" size={13} color="rgba(255,255,255,0.85)" />
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginLeft: 4 }}>
                  {user.city}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.statsCard}>
          <Card style={[styles.stats, { borderColor: theme.colors.border }]} padding={0}>
            {isSeller ? (
              <>
                <Stat label="Listings" value={listingsCount} delay={120} />
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                <Stat label="Leads" value={leadsCount} delay={180} />
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                <Stat label="Views" value={sellerViews} delay={240} />
              </>
            ) : (
              <>
                <Stat label="Inquiries" value={inquiriesCount} delay={120} />
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                <Stat label="Visits" value={visitsCount} delay={180} />
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                <Stat label="Saved" value={savedCount} delay={240} />
              </>
            )}
          </Card>
        </View>

        {sections.map((section, idx) => (
          <View key={idx} style={{ paddingHorizontal: 20, marginTop: idx === 0 ? 8 : 22 }}>
            {!!section.title && <SectionHeader title={section.title} style={{ paddingHorizontal: 0 }} />}
            <Card padding={0}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    item.onPress ? item.onPress() : item.route ? navigation.navigate(item.route) : null
                  }
                  style={[
                    styles.menuRow,
                    i < section.items.length - 1 && {
                      borderBottomColor: theme.colors.divider,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.menuIcon,
                      {
                        backgroundColor:
                          item.tone === 'danger'
                            ? theme.colors.error + '15'
                            : theme.colors.primary + '14',
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon as any}
                      size={20}
                      color={item.tone === 'danger' ? theme.colors.error : theme.colors.primary}
                    />
                  </View>
                  <Text
                    variant="bodyLg"
                    weight="600"
                    style={{
                      flex: 1,
                      color: item.tone === 'danger' ? theme.colors.error : theme.colors.text,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
        <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 20 }}>
          Aabroo • v1.0.0
        </Text>
      </ScrollView>

      <BottomSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} title="Log out?">
        <Text variant="body" color="textSecondary" style={{ marginBottom: 20 }}>
          Are you sure you want to log out?
        </Text>
        <GradientButton
          title="Log out"
          iconName="log-out-outline"
          iconPosition="left"
          onPress={() => {
            setLogoutOpen(false);
            dispatch(logoutThunk());
          }}
          size="lg"
        />
        <View style={{ height: 10 }} />
        <GradientButton title="Cancel" variant="ghost" size="lg" onPress={() => setLogoutOpen(false)} />
      </BottomSheet>

      <BottomSheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account?">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: theme.colors.error + '14',
            borderColor: theme.colors.error + '40',
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Icon name="warning" size={20} color={theme.colors.error} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text weight="700" style={{ color: theme.colors.error }}>
              This action is permanent
            </Text>
            <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, lineHeight: 19 }}>
              {isSeller
                ? 'All your listings, leads, and analytics will be permanently deleted. This cannot be undone.'
                : 'All your inquiries, visits, saved properties, and chat history will be permanently deleted. This cannot be undone.'}
            </Text>
          </View>
        </View>
        <GradientButton
          title={deleting ? 'Deleting…' : 'Yes, delete my account'}
          loading={deleting}
          onPress={async () => {
            setDeleting(true);
            const action = await dispatch(deleteAccountThunk());
            setDeleting(false);
            setDeleteOpen(false);
            if (deleteAccountThunk.rejected.match(action)) {
              Alert.alert('Could not delete', (action.payload as string) ?? 'Try again later.');
            }
          }}
          variant="primary"
          size="lg"
          style={{ backgroundColor: theme.colors.error }}
        />
        <View style={{ height: 10 }} />
        <GradientButton title="Cancel" variant="ghost" size="lg" onPress={() => setDeleteOpen(false)} />
      </BottomSheet>
    </Screen>
  );
};

const Stat: React.FC<{ label: string; value: number; delay?: number }> = ({
  label,
  value,
  delay = 0,
}) => (
  <View style={statStyles.stat}>
    <CountUp to={value} delay={delay} duration={700} variant="h3" weight="800" />
    <Text variant="caption" color="textMuted">{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
});

const styles = StyleSheet.create({
  hero: {
    paddingTop: 18,
    paddingBottom: 70,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  stats: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  divider: {
    width: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});

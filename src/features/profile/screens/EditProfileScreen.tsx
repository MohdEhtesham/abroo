import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Avatar,
  CustomTextInput,
  GradientButton,
  Screen,
  Text,
} from '../../../components';
import { CITIES } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUser } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';

export const EditProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [saving, setSaving] = useState(false);

  const onSave = () => {
    if (!fullName || !email || !phone) {
      Alert.alert('Missing info', 'Please fill all required fields.');
      return;
    }
    if (!user) return;
    setSaving(true);
    setTimeout(() => {
      dispatch(setUser({ ...user, fullName, email, phone, city }));
      setSaving(false);
      Alert.alert('Saved!', 'Your profile has been updated.');
      navigation.goBack();
    }, 700);
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Edit Profile" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
          <View style={styles.avatarRow}>
            <Avatar name={fullName} uri={user?.avatar} size={88} />
            <View style={[styles.cameraBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
              <Icon name="camera" size={16} color="#fff" />
            </View>
          </View>
          <View style={{ marginTop: 24 }}>
            <CustomTextInput label="Full Name" value={fullName} onChangeText={setFullName} leftIcon="person-outline" />
            <CustomTextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <CustomTextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              leftIcon="call-outline"
              keyboardType="number-pad"
              maxLength={10}
            />
            <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginTop: 4, marginBottom: 6 }}>
              City
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CITIES.map(c => {
                const active = c === city;
                return (
                  <View
                    key={c}
                    style={[
                      styles.cityChip,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      onPress={() => setCity(c)}
                      weight="600"
                      style={{ color: active ? '#fff' : theme.colors.text }}
                    >
                      {c}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
          <View style={{ marginTop: 28 }}>
            <GradientButton title="Save Changes" loading={saving} onPress={onSave} size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  avatarRow: {
    alignSelf: 'center',
    marginTop: 16,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
});

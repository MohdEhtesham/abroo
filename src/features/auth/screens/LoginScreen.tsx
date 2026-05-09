import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BottomSheet,
  CustomTextInput,
  GradientButton,
  Screen,
  Text,
} from '../../../components';
import { APP_NAME } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loginThunk } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import { authService } from '../services/authService';
import type { UserRole } from '../types';
import { LoginFormData, loginSchema, phoneRegex } from '../../../utils/validators';

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { loading } = useAppSelector(s => s.auth);
  const [role, setRole] = useState<UserRole>('consumer');
  const [otpSheetOpen, setOtpSheetOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    const action = await dispatch(loginThunk({ ...data, role }));
    if (loginThunk.rejected.match(action)) {
      Alert.alert('Login failed', action.payload as string);
    }
  };

  const openOtpFlow = () => {
    setOtpPhone('');
    setOtpError(null);
    setOtpSheetOpen(true);
  };

  const handleSendOtp = async () => {
    const cleaned = otpPhone.trim();
    if (!phoneRegex.test(cleaned)) {
      setOtpError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setOtpError(null);
    setSendingOtp(true);
    try {
      await authService.sendOtp(cleaned);
      setSendingOtp(false);
      setOtpSheetOpen(false);
      navigation.navigate('OTPVerification', { phone: cleaned, role });
    } catch (e: any) {
      setSendingOtp(false);
      setOtpError(e?.message ?? 'Could not send OTP. Try again.');
    }
  };

  return (
    <Screen padded edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text variant="displayMd" weight="800" style={{ letterSpacing: -0.5 }}>
            Welcome back
          </Text>
          <Text variant="body" color="textSecondary" style={{ marginTop: 6 }}>
            Sign in to {APP_NAME} to continue your search.
          </Text>

          <View
            style={[
              styles.roleSwitch,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {(
              [
                { value: 'consumer' as UserRole, label: 'Buyer', icon: 'search-outline' },
                { value: 'seller' as UserRole, label: 'Seller', icon: 'business-outline' },
              ]
            ).map(opt => {
              const active = role === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setRole(opt.value)}
                  style={[
                    styles.roleTab,
                    active && {
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                  ]}
                >
                  <Icon
                    name={opt.icon as any}
                    size={16}
                    color={active ? '#fff' : theme.colors.textMuted}
                  />
                  <Text
                    weight="700"
                    style={{
                      marginLeft: 8,
                      color: active ? '#fff' : theme.colors.textMuted,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 22 }}>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, value } }) => (
                <CustomTextInput
                  label="Email or Phone"
                  placeholder="example@email.com"
                  leftIcon="person-outline"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  error={errors.identifier?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <CustomTextInput
                  label="Password"
                  placeholder="Enter password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />
            <Pressable
              style={{ alignSelf: 'flex-end' }}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text variant="bodySm" weight="600" style={{ color: theme.colors.primary }}>
                Forgot password?
              </Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 28 }}>
            <GradientButton
              title={`Sign In as ${role === 'seller' ? 'Seller' : 'Buyer'}`}
              size="lg"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View style={[styles.divider]}>
            <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
            <Text variant="caption" color="textMuted" style={{ marginHorizontal: 12 }}>
              OR
            </Text>
            <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
          </View>

          <GradientButton
            title="Login with OTP"
            variant="outline"
            iconName="phone-portrait-outline"
            iconPosition="left"
            onPress={openOtpFlow}
          />

          <View style={styles.signupRow}>
            <Text variant="bodySm" color="textSecondary">
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>
                Create one
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={otpSheetOpen}
        onClose={() => setOtpSheetOpen(false)}
        title="Login with OTP"
      >
        <Text variant="bodySm" color="textSecondary" style={{ marginBottom: 16 }}>
          Enter your 10-digit Indian mobile number. We'll send a 4-digit code.
        </Text>
        <CustomTextInput
          label="Mobile number"
          placeholder="9876543210"
          leftIcon="call-outline"
          keyboardType="number-pad"
          maxLength={10}
          autoFocus
          value={otpPhone}
          onChangeText={v => {
            setOtpPhone(v.replace(/\D/g, ''));
            if (otpError) setOtpError(null);
          }}
          error={otpError ?? undefined}
        />
        <Text variant="caption" color="textMuted" style={{ marginBottom: 16 }}>
          Demo: any valid number. OTP is always 1234.
        </Text>
        <GradientButton
          title="Send OTP"
          iconName="arrow-forward"
          loading={sendingOtp}
          onPress={handleSendOtp}
          size="lg"
        />
      </BottomSheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  roleSwitch: {
    flexDirection: 'row',
    marginTop: 22,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  line: {
    flex: 1,
    height: 1,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
});

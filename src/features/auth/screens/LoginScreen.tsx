import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BottomSheet,
  CustomTextInput,
  GradientButton,
  KeyboardScreen,
  Text,
} from '../../../components';
import { APP_NAME } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store';
import { loginThunk } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import { AuthBackgroundOrbs } from '../components/AuthBackgroundOrbs';
import { useStaggerEntry } from '../hooks/useStaggerEntry';
import { authService } from '../services/authService';
import type { UserRole } from '../types';
import { LoginFormData, loginSchema, phoneRegex } from '../../../utils/validators';

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { loading } = useAppSelector(s => s.auth);
  const [role, setRole] = useState<UserRole>('consumer');
  const [otpSheetOpen, setOtpSheetOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Entrance animations
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(-20);
  const formY = useSharedValue(40);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) });
    heroY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.exp) });
    formOpacity.value = withDelay(220, withTiming(1, { duration: 600 }));
    formY.value = withDelay(220, withTiming(0, { duration: 700, easing: Easing.out(Easing.exp) }));
  }, [heroOpacity, heroY, formOpacity, formY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  // Cascade entries (delays from form-card animation start)
  const roleEntry = useStaggerEntry(380);
  const emailEntry = useStaggerEntry(480);
  const passwordEntry = useStaggerEntry(580);
  const forgotEntry = useStaggerEntry(660);
  const ctaEntry = useStaggerEntry(740);
  const dividerEntry = useStaggerEntry(820);
  const otpBtnEntry = useStaggerEntry(880);
  const trustEntry = useStaggerEntry(960);
  const signupEntry = useStaggerEntry(1020);

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primaryDark} />

      {/* HERO */}
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary, '#1A2D6E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <AuthBackgroundOrbs accentColor={theme.colors.accent} />
        <Animated.View style={heroStyle}>
          <View style={styles.brandRow}>
            <View style={[styles.brandDot, { backgroundColor: theme.colors.accent }]}>
              <Icon name="home" size={16} color="#fff" />
            </View>
            <Text weight="800" style={{ color: '#fff', marginLeft: 8, letterSpacing: 0.4 }}>
              {APP_NAME}
            </Text>
          </View>

          <Text variant="displayMd" weight="800" style={styles.heroTitle}>
            Welcome back
          </Text>
          <Text variant="body" style={styles.heroSubtitle}>
            Sign in to continue your dream-home search.
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* CARD */}
      <View style={{ flex: 1, marginTop: -28 }}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            formStyle,
          ]}
        >
          <KeyboardScreen contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Role tabs */}
            <Animated.View style={roleEntry}>
            <Text variant="caption" weight="700" color="textMuted" style={styles.fieldLabel}>
              I AM A
            </Text>
            <View style={styles.roleRow}>
              {(
                [
                  {
                    value: 'consumer' as UserRole,
                    label: 'Buyer',
                    tagline: 'Find your dream home',
                    icon: 'home',
                  },
                  {
                    value: 'seller' as UserRole,
                    label: 'Seller',
                    tagline: 'List & sell properties',
                    icon: 'business',
                  },
                ]
              ).map(opt => {
                const active = role === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setRole(opt.value)}
                    style={styles.roleCardWrap}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.roleCard, styles.roleCardActive]}
                      >
                        <View style={styles.roleCardCheck}>
                          <Icon name="checkmark" size={12} color={theme.colors.primary} />
                        </View>
                        <View style={[styles.roleIconChip, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                          <Icon name={opt.icon as any} size={20} color="#fff" />
                        </View>
                        <Text weight="800" style={{ color: '#fff', fontSize: 15, marginTop: 8 }}>
                          {opt.label}
                        </Text>
                        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' }}>
                          {opt.tagline}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.roleCard,
                          {
                            backgroundColor: theme.colors.surfaceElevated,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View style={[styles.roleIconChip, { backgroundColor: theme.colors.primary + '14' }]}>
                          <Icon name={`${opt.icon}-outline` as any} size={20} color={theme.colors.primary} />
                        </View>
                        <Text weight="700" style={{ marginTop: 8, fontSize: 15, color: theme.colors.text }}>
                          {opt.label}
                        </Text>
                        <Text variant="caption" color="textMuted" style={{ marginTop: 2, textAlign: 'center' }}>
                          {opt.tagline}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            </Animated.View>

            {/* Form */}
            <View style={{ marginTop: 22 }}>
              <Animated.View style={emailEntry}>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    label="Email or Phone"
                    placeholder="example@email.com"
                    leftIcon="mail-outline"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.identifier?.message}
                  />
                )}
              />
              </Animated.View>
              <Animated.View style={passwordEntry}>
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
              </Animated.View>
              <Animated.View style={forgotEntry}>
              <Pressable
                style={{ alignSelf: 'flex-end' }}
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={6}
              >
                <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>
                  Forgot password?
                </Text>
              </Pressable>
              </Animated.View>
            </View>

            <Animated.View style={[ctaEntry, { marginTop: 24 }]}>
              <GradientButton
                title={`Sign In as ${role === 'seller' ? 'Seller' : 'Buyer'}`}
                iconName="arrow-forward"
                size="lg"
                loading={loading}
                onPress={handleSubmit(onSubmit)}
              />
            </Animated.View>

            <Animated.View style={[styles.divider, dividerEntry]}>
              <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
              <Text variant="caption" weight="700" color="textMuted" style={styles.dividerText}>
                OR CONTINUE WITH
              </Text>
              <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
            </Animated.View>

            <Animated.View style={otpBtnEntry}>
              <Pressable
                onPress={openOtpFlow}
                android_ripple={{ color: theme.colors.primary + '22' }}
                style={({ pressed }) => [
                  styles.socialBtn,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.socialIcon, { backgroundColor: theme.colors.primary + '14' }]} pointerEvents="none">
                  <Icon name="phone-portrait" size={18} color={theme.colors.primary} />
                </View>
                <Text weight="700" style={{ marginLeft: 12, flex: 1 }} pointerEvents="none">
                  Login with OTP
                </Text>
                <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            </Animated.View>

            {/* Trust signals */}
            <Animated.View style={[styles.trust, { borderTopColor: theme.colors.divider }, trustEntry]}>
              <View style={styles.trustItem}>
                <Icon name="shield-checkmark" size={14} color={theme.colors.success} />
                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  RERA verified
                </Text>
              </View>
              <View style={[styles.trustDot, { backgroundColor: theme.colors.border }]} />
              <View style={styles.trustItem}>
                <Icon name="people" size={14} color={theme.colors.primary} />
                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  50K+ users
                </Text>
              </View>
              <View style={[styles.trustDot, { backgroundColor: theme.colors.border }]} />
              <View style={styles.trustItem}>
                <Icon name="lock-closed" size={14} color={theme.colors.accent} />
                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  256-bit secure
                </Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.signupRow, signupEntry]}>
              <Text variant="bodySm" color="textSecondary">
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={6}>
                <Text variant="bodySm" weight="800" style={{ color: theme.colors.primary }}>
                  Create one
                </Text>
              </Pressable>
            </Animated.View>
          </KeyboardScreen>
        </Animated.View>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 28,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  card: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: {
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCardWrap: {
    flex: 1,
  },
  roleCard: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 102,
    overflow: 'hidden',
  },
  roleCardActive: {
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  roleCardCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  dividerText: {
    marginHorizontal: 12,
    letterSpacing: 0.6,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 10,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
});

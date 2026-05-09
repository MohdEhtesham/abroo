import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { CustomTextInput, GradientButton, Text } from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { signupThunk } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import { AuthBackgroundOrbs } from '../components/AuthBackgroundOrbs';
import { useStaggerEntry } from '../hooks/useStaggerEntry';
import type { UserRole } from '../types';
import { SignupFormData, signupSchema } from '../../../utils/validators';

export const SignupScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { loading } = useAppSelector(s => s.auth);
  const [role, setRole] = useState<UserRole>('consumer');

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

  const roleEntry = useStaggerEntry(380);
  const nameEntry = useStaggerEntry(480);
  const emailEntry = useStaggerEntry(560);
  const phoneEntry = useStaggerEntry(640);
  const passwordEntry = useStaggerEntry(720);
  const ctaEntry = useStaggerEntry(820);
  const signinEntry = useStaggerEntry(900);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '' },
  });

  const onSubmit = async (data: SignupFormData) => {
    const action = await dispatch(signupThunk({ ...data, role }));
    if (signupThunk.rejected.match(action)) {
      Alert.alert('Signup failed', action.payload as string);
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
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <AuthBackgroundOrbs accentColor={theme.colors.accent} />
        <Animated.View style={heroStyle}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            >
              <Icon name="chevron-back" size={20} color="#fff" />
            </Pressable>
          </View>

          <Text variant="displayMd" weight="800" style={styles.heroTitle}>
            Create account
          </Text>
          <Text variant="body" style={styles.heroSubtitle}>
            Join 50,000+ buyers & sellers on Aabroo.
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* CARD */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: -28 }}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            formStyle,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
          >
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
                    desc: 'Discover & inquire',
                    icon: 'search',
                  },
                  {
                    value: 'seller' as UserRole,
                    label: 'Seller',
                    desc: 'List & reach buyers',
                    icon: 'business',
                  },
                ]
              ).map(opt => {
                const active = role === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setRole(opt.value)}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: active
                          ? theme.colors.primary + '0F'
                          : theme.colors.surfaceElevated,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        {
                          backgroundColor: active ? theme.colors.primary : theme.colors.divider,
                        },
                      ]}
                    >
                      <Icon
                        name={(active ? opt.icon : `${opt.icon}-outline`) as any}
                        size={20}
                        color={active ? '#fff' : theme.colors.text}
                      />
                    </View>
                    <Text
                      weight="800"
                      style={{
                        marginTop: 10,
                        color: active ? theme.colors.primary : theme.colors.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                    <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                      {opt.desc}
                    </Text>
                    {active && (
                      <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                        <Icon name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            </Animated.View>

            <View style={{ marginTop: 22 }}>
              <Animated.View style={nameEntry}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    label="Full Name"
                    placeholder="Your name"
                    leftIcon="person-outline"
                    value={value}
                    onChangeText={onChange}
                    error={errors.fullName?.message}
                  />
                )}
              />
              </Animated.View>
              <Animated.View style={emailEntry}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    label="Email"
                    placeholder="example@email.com"
                    leftIcon="mail-outline"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                  />
                )}
              />
              </Animated.View>
              <Animated.View style={phoneEntry}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    label="Phone"
                    placeholder="9876543210"
                    leftIcon="call-outline"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={value}
                    onChangeText={onChange}
                    error={errors.phone?.message}
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
                    placeholder="Min 6 characters"
                    leftIcon="lock-closed-outline"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />
              </Animated.View>
            </View>

            <Animated.View style={[ctaEntry, { marginTop: 18 }]}>
              <GradientButton
                title="Create Account"
                iconName="arrow-forward"
                size="lg"
                loading={loading}
                onPress={handleSubmit(onSubmit)}
              />
            </Animated.View>

            <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 14 }}>
              By signing up you agree to our{' '}
              <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
                Terms
              </Text>
              {' '}&{' '}
              <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
                Privacy Policy
              </Text>
              .
            </Text>

            <Animated.View style={[styles.signinRow, { borderTopColor: theme.colors.divider }, signinEntry]}>
              <Text variant="bodySm" color="textSecondary">
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.goBack()} hitSlop={6}>
                <Text variant="bodySm" weight="800" style={{ color: theme.colors.primary }}>
                  Sign In
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 22,
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
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { CustomTextInput, GradientButton, Text } from '../../../components';
import { useTheme } from '../../../theme';
import { forgotSchema } from '../../../utils/validators';
import { AuthBackgroundOrbs } from '../components/AuthBackgroundOrbs';
import { authService } from '../services/authService';

interface FormData {
  identifier: string;
}

export const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedTo, setSubmittedTo] = useState('');

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(-20);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(40);
  const iconScale = useSharedValue(1);
  const successScale = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) });
    heroY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.exp) });
    cardOpacity.value = withDelay(220, withTiming(1, { duration: 600 }));
    cardY.value = withDelay(220, withTiming(0, { duration: 700, easing: Easing.out(Easing.exp) }));

    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [heroOpacity, heroY, cardOpacity, cardY, iconScale]);

  useEffect(() => {
    if (sent) {
      successScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    }
  }, [sent, successScale]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: yupResolver(forgotSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await authService.forgotPassword(data.identifier);
    setLoading(false);
    setSubmittedTo(data.identifier);
    setSent(true);
  };

  const resend = async () => {
    setLoading(true);
    await authService.forgotPassword(getValues('identifier'));
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primaryDark} />

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

          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: sent ? theme.colors.success : theme.colors.accent },
              ]}
            >
              <Icon name={sent ? 'checkmark' : 'lock-closed'} size={28} color="#fff" />
            </View>
          </Animated.View>

          <Text variant="h1" weight="800" align="center" style={styles.heroTitle}>
            {sent ? 'Check your inbox' : 'Reset password'}
          </Text>
          <Text variant="body" align="center" style={styles.heroSubtitle}>
            {sent
              ? `We sent a reset link to\n${submittedTo}`
              : 'No worries — enter your email or phone and\nwe\'ll send a reset link.'}
          </Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, marginTop: -28 }}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            cardStyle,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
          >
            {!sent ? (
              <>
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, value } }) => (
                    <CustomTextInput
                      label="Email or Phone"
                      placeholder="example@email.com"
                      leftIcon="person-outline"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      error={errors.identifier?.message}
                    />
                  )}
                />
                <View style={{ marginTop: 16 }}>
                  <GradientButton
                    title="Send Reset Link"
                    iconName="send"
                    iconPosition="left"
                    loading={loading}
                    onPress={handleSubmit(onSubmit)}
                    size="lg"
                  />
                </View>
                <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '0A', borderColor: theme.colors.primary + '20' }]}>
                  <Icon name="information-circle" size={18} color={theme.colors.primary} />
                  <Text variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: 8, lineHeight: 18 }}>
                    The reset link will expire in 30 minutes. Check your spam folder if you don't see it.
                  </Text>
                </View>
              </>
            ) : (
              <Animated.View style={successStyle}>
                <View style={[styles.successCard, { backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '30' }]}>
                  <View style={[styles.successDot, { backgroundColor: theme.colors.success }]}>
                    <Icon name="mail-open" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text weight="700">Reset link sent</Text>
                    <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                      Open the link to set a new password.
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 18 }}>
                  <GradientButton
                    title="Back to Sign In"
                    iconName="arrow-back"
                    iconPosition="left"
                    onPress={() => navigation.goBack()}
                    size="lg"
                  />
                </View>

                <View style={styles.resendRow}>
                  <Text variant="bodySm" color="textSecondary">
                    Didn't receive it?{' '}
                  </Text>
                  <Pressable onPress={resend} hitSlop={6}>
                    <Text variant="bodySm" weight="800" style={{ color: theme.colors.primary }}>
                      {loading ? 'Resending…' : 'Resend link'}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            <View style={[styles.signinRow, { borderTopColor: theme.colors.divider }]}>
              <Text variant="bodySm" color="textSecondary">
                Remembered it?{' '}
              </Text>
              <Pressable onPress={() => navigation.goBack()} hitSlop={6}>
                <Text variant="bodySm" weight="800" style={{ color: theme.colors.primary }}>
                  Sign In
                </Text>
              </Pressable>
            </View>
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
  iconWrap: {
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  heroTitle: {
    color: '#fff',
    marginTop: 14,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  successDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

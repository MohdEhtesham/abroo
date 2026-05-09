import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
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
import { GradientButton, Text } from '../../../components';
import { useAppDispatch } from '../../../store';
import { verifyOtpThunk } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import { AuthBackgroundOrbs } from '../components/AuthBackgroundOrbs';

const OTP_LEN = 4;

export const OTPVerificationScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const phone = route.params?.phone ?? '••••••••••';
  const role = route.params?.role ?? 'consumer';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [seconds, setSeconds] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const refs = useRef<Array<TextInput | null>>([]);

  // Entrance animations
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(-20);
  const cardY = useSharedValue(40);
  const cardOpacity = useSharedValue(0);

  // Icon pulse
  const iconScale = useSharedValue(1);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) });
    heroY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.exp) });
    cardOpacity.value = withDelay(220, withTiming(1, { duration: 600 }));
    cardY.value = withDelay(220, withTiming(0, { duration: 700, easing: Easing.out(Easing.exp) }));

    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [heroOpacity, heroY, cardOpacity, cardY, iconScale]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

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

  const onChange = (idx: number, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < OTP_LEN - 1) {
      refs.current[idx + 1]?.focus();
      setActiveIdx(idx + 1);
    }
  };

  const onKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
      setActiveIdx(idx - 1);
    }
  };

  const onVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== OTP_LEN) {
      Alert.alert('Incomplete OTP', `Please enter all ${OTP_LEN} digits`);
      return;
    }
    setSubmitting(true);
    const action = await dispatch(verifyOtpThunk({ phone, otp, role }));
    setSubmitting(false);
    if (verifyOtpThunk.rejected.match(action)) {
      Alert.alert('Verification failed', 'Use 1234 for demo');
    }
  };

  const resend = () => {
    setSeconds(30);
    setDigits(Array(OTP_LEN).fill(''));
    refs.current[0]?.focus();
    setActiveIdx(0);
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
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.accent }]}>
              <Icon name="mail" size={28} color="#fff" />
            </View>
          </Animated.View>

          <Text variant="h1" weight="800" align="center" style={styles.heroTitle}>
            Verify your number
          </Text>
          <Text variant="body" align="center" style={styles.heroSubtitle}>
            We sent a 4-digit code to{'\n'}
            <Text weight="700" style={{ color: '#fff' }}>+91 {phone}</Text>
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
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <OtpBox
                key={i}
                index={i}
                value={d}
                isActive={i === activeIdx && !d}
                isFilled={!!d}
                allFilled={digits.every(x => !!x)}
                onChange={v => onChange(i, v)}
                onKeyPress={k => onKeyPress(i, k)}
                onFocus={() => setActiveIdx(i)}
                inputRef={r => {
                  refs.current[i] = r;
                }}
              />
            ))}
          </View>

          <View style={[styles.demoChip, { backgroundColor: theme.colors.accent + '14', borderColor: theme.colors.accent + '40' }]}>
            <Icon name="information-circle" size={14} color={theme.colors.accentDark} />
            <Text variant="caption" weight="700" style={{ color: theme.colors.accentDark, marginLeft: 6 }}>
              Demo OTP: 1234
            </Text>
          </View>

          <View style={{ marginTop: 24 }}>
            <GradientButton
              title="Verify & Continue"
              iconName="checkmark"
              loading={submitting}
              onPress={onVerify}
              size="lg"
            />
          </View>

          <View style={styles.resendRow}>
            <Text variant="bodySm" color="textSecondary">
              Didn't receive the code?{' '}
            </Text>
            {seconds > 0 ? (
              <View style={styles.timerChip}>
                <Icon name="time-outline" size={12} color={theme.colors.textMuted} />
                <Text variant="bodySm" weight="700" color="textMuted" style={{ marginLeft: 4 }}>
                  {seconds}s
                </Text>
              </View>
            ) : (
              <Pressable onPress={resend} hitSlop={6}>
                <Text variant="bodySm" weight="800" style={{ color: theme.colors.primary }}>
                  Resend code
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable onPress={() => navigation.goBack()} style={styles.changeNumber} hitSlop={6}>
            <Icon name="create-outline" size={14} color={theme.colors.textMuted} />
            <Text variant="caption" weight="600" color="textSecondary" style={{ marginLeft: 4 }}>
              Change number
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const OtpBox: React.FC<{
  index: number;
  value: string;
  isActive: boolean;
  isFilled: boolean;
  allFilled: boolean;
  onChange: (v: string) => void;
  onKeyPress: (key: string) => void;
  onFocus: () => void;
  inputRef: (r: TextInput | null) => void;
}> = ({ index, value, isActive, isFilled, allFilled, onChange, onKeyPress, onFocus, inputRef }) => {
  const theme = useTheme();
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const burst = useSharedValue(0);

  // Bounce-in entrance, staggered per box
  useEffect(() => {
    const entryDelay = 480 + index * 100;
    opacity.value = withDelay(entryDelay, withTiming(1, { duration: 280 }));
    scale.value = withDelay(
      entryDelay,
      withSpring(1, { damping: 9, stiffness: 220 }),
    );
  }, [index, scale, opacity]);

  // Active/filled scale up, plus burst when all 4 boxes are filled
  useEffect(() => {
    const target = allFilled ? 1.1 : isActive || isFilled ? 1.06 : 1;
    scale.value = withSpring(target, { damping: 12, stiffness: 220 });
  }, [scale, isActive, isFilled, allFilled]);

  // Success burst: gold halo expands + fades when all filled
  useEffect(() => {
    if (allFilled) {
      burst.value = 0;
      burst.value = withDelay(
        index * 50,
        withSequence(
          withTiming(1, { duration: 360, easing: Easing.out(Easing.exp) }),
          withTiming(0, { duration: 600 }),
        ),
      );
    }
  }, [allFilled, index, burst]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value * 0.6,
    transform: [{ scale: 1 + burst.value * 0.4 }],
  }));

  const borderColor = allFilled
    ? theme.colors.success
    : isFilled
    ? theme.colors.success
    : isActive
    ? theme.colors.primary
    : theme.colors.border;

  return (
    <Animated.View style={style}>
      <Animated.View
        pointerEvents="none"
        style={[styles.burst, { borderColor: theme.colors.success }, burstStyle]}
      />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key)}
        onFocus={onFocus}
        keyboardType="number-pad"
        maxLength={1}
        style={[
          styles.otpInput,
          {
            borderColor,
            backgroundColor: isFilled
              ? theme.colors.success + '10'
              : isActive
              ? theme.colors.primary + '0A'
              : theme.colors.surfaceElevated,
            color: theme.colors.text,
          },
        ]}
      />
    </Animated.View>
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpInput: {
    width: 64,
    height: 72,
    borderWidth: 2,
    borderRadius: 16,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  burst: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: 24,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
});

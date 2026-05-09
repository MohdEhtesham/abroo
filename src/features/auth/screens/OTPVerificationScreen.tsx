import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AnimatedHeader, GradientButton, Screen, Text } from '../../../components';
import { useAppDispatch } from '../../../store';
import { verifyOtpThunk } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';

const OTP_LEN = 4;

export const OTPVerificationScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const phone = route.params?.phone ?? '••••••••••';
  const role = route.params?.role ?? 'consumer';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [seconds, setSeconds] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const onChange = (idx: number, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < OTP_LEN - 1) refs.current[idx + 1]?.focus();
  };

  const onKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
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
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AnimatedHeader title="Verify OTP" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primary + '12' }]}>
            <Text style={{ fontSize: 32 }}>📩</Text>
          </View>
          <Text variant="h2" weight="800" align="center" style={{ marginTop: 24 }}>Enter verification code</Text>
          <Text variant="body" color="textSecondary" align="center" style={{ marginTop: 8 }}>
            We sent a 4-digit code to{'\n'}+91 {phone}
          </Text>
          <Text variant="caption" align="center" style={{ color: theme.colors.accent, marginTop: 8 }}>
            (Demo OTP: 1234)
          </Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={r => {
                  refs.current[i] = r;
                }}
                value={d}
                onChangeText={v => onChange(i, v)}
                onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.otpInput,
                  {
                    borderColor: d ? theme.colors.primary : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                  },
                ]}
              />
            ))}
          </View>

          <View style={{ marginTop: 32 }}>
            <GradientButton title="Verify & Continue" loading={submitting} onPress={onVerify} size="lg" />
          </View>

          <View style={styles.resendRow}>
            <Text variant="bodySm" color="textSecondary">Didn't receive the code? </Text>
            {seconds > 0 ? (
              <Text variant="bodySm" weight="600" color="textMuted">Resend in {seconds}s</Text>
            ) : (
              <Pressable onPress={resend}>
                <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>Resend</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 12,
  },
  otpInput: {
    width: 60,
    height: 64,
    borderWidth: 1.5,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
});

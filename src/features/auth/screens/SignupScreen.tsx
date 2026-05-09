import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AnimatedHeader, CustomTextInput, GradientButton, Screen, Text } from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { signupThunk } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import type { UserRole } from '../types';
import { SignupFormData, signupSchema } from '../../../utils/validators';

export const SignupScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { loading } = useAppSelector(s => s.auth);
  const [role, setRole] = useState<UserRole>('consumer');

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
    <Screen edges={['top', 'bottom']}>
      <AnimatedHeader title="Create Account" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="h2" weight="800">Hello there 👋</Text>
          <Text variant="body" color="textSecondary" style={{ marginTop: 6 }}>
            Sign up in seconds and unlock premium properties.
          </Text>

          <Text variant="bodySm" weight="700" color="textSecondary" style={{ marginTop: 22, marginBottom: 10, letterSpacing: 0.4 }}>
            I AM A
          </Text>
          <View style={styles.roleRow}>
            {(
              [
                {
                  value: 'consumer' as UserRole,
                  label: 'Buyer',
                  desc: 'Discover and inquire about properties',
                  icon: 'search-outline',
                },
                {
                  value: 'seller' as UserRole,
                  label: 'Seller',
                  desc: 'List properties and reach buyers',
                  icon: 'home-outline',
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
                      backgroundColor: active ? theme.colors.primary + '12' : theme.colors.surfaceElevated,
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
                      name={opt.icon as any}
                      size={18}
                      color={active ? '#fff' : theme.colors.text}
                    />
                  </View>
                  <Text
                    weight="700"
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

          <View style={{ marginTop: 22 }}>
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
          </View>
          <View style={{ marginTop: 16 }}>
            <GradientButton
              title="Create Account"
              size="lg"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
          <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 16 }}>
            By signing up you agree to our Terms & Privacy Policy.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text variant="bodySm" color="textSecondary">Already have an account? </Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
});

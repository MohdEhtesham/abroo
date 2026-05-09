import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { AnimatedHeader, CustomTextInput, GradientButton, Screen, Text } from '../../../components';
import { authService } from '../services/authService';
import { useTheme } from '../../../theme';
import { forgotSchema } from '../../../utils/validators';

interface FormData {
  identifier: string;
}

export const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(forgotSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await authService.forgotPassword(data.identifier);
    setLoading(false);
    setSent(true);
    Alert.alert('Reset link sent', 'Check your email or SMS for a reset link.');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AnimatedHeader title="Forgot Password" onBackPress={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary + '12' }}>
            <Text style={{ fontSize: 32 }}>🔐</Text>
          </View>
        </View>
        <Text variant="h2" weight="800" align="center">Reset your password</Text>
        <Text variant="body" color="textSecondary" align="center" style={{ marginTop: 8, marginBottom: 24 }}>
          Enter your email or phone and we'll send you a reset link.
        </Text>
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
        <View style={{ marginTop: 12 }}>
          <GradientButton
            title={sent ? 'Resend Link' : 'Send Reset Link'}
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            size="lg"
          />
        </View>
      </View>
    </Screen>
  );
};

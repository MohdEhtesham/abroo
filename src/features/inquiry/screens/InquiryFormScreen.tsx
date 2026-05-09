import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  AnimatedHeader,
  Card,
  CustomTextInput,
  GradientButton,
  Screen,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { submitInquiryThunk } from '../../../store/slices/inquirySlice';
import { useTheme } from '../../../theme';
import { InquiryFormData, inquirySchema } from '../../../utils/validators';
import { propertyService } from '../../property/services/propertyService';
import type { Property } from '../../property/types';

export const InquiryFormScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const propertyId = route.params?.propertyId as string;
  const user = useAppSelector(s => s.auth.user);
  const submitting = useAppSelector(s => s.inquiry.submitting);

  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (propertyId) propertyService.detail(propertyId).then(setProperty);
  }, [propertyId]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: yupResolver(inquirySchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      message: '',
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    if (!property) return;
    const action = await dispatch(
      submitInquiryThunk({
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImage: property.images[0],
        propertyLocation: `${property.locality}, ${property.city}`,
        ...data,
      }),
    );
    if (submitInquiryThunk.fulfilled.match(action)) {
      navigation.replace('InquirySuccess', { inquiryId: action.payload.id });
    }
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Submit Inquiry" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {property && (
            <Card padding={12}>
              <View style={{ flexDirection: 'row' }}>
                <Image source={{ uri: property.images[0] }} style={styles.propImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyLg" weight="700" numberOfLines={1}>
                    {property.title}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                    {property.locality}, {property.city}
                  </Text>
                  <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary, marginTop: 6 }}>
                    {property.builder}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <Text variant="h3" weight="700" style={{ marginTop: 24 }}>Your details</Text>
          <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, marginBottom: 18 }}>
            An advisor will reach out to you in 30 minutes.
          </Text>

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
            name="message"
            render={({ field: { onChange, value } }) => (
              <CustomTextInput
                label="Message (optional)"
                placeholder="Tell us your requirements"
                multiline
                numberOfLines={4}
                value={value}
                onChangeText={onChange}
                error={errors.message?.message}
                containerStyle={{ minHeight: 100 }}
              />
            )}
          />

          <View style={{ marginTop: 12 }}>
            <GradientButton
              title="Submit Inquiry"
              size="lg"
              loading={submitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 16 }}>
            By submitting you agree to be contacted by Aabroo advisors.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  propImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
});

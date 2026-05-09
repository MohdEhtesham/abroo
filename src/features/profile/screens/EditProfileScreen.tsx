import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Avatar,
  BottomSheet,
  CustomTextInput,
  GradientButton,
  KeyboardScreen,
  Screen,
  Text,
} from '../../../components';
import { CITIES } from '../../../constants';
import { useIsMounted, useThrottledCallback } from '../../../hooks';
import { authService } from '../../auth/services/authService';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setUser } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import type { ApiError } from '../../../services/apiClient';

export const EditProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const isMounted = useIsMounted();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [avatar, setAvatar] = useState(user?.avatar);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const onSave = useThrottledCallback(async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Please fill all required fields.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        fullName,
        email,
        phone,
        city,
        avatar,
      });
      if (!isMounted()) return;
      dispatch(setUser(updated as any));
      Alert.alert('Saved!', 'Your profile has been updated.');
      navigation.goBack();
    } catch (e: any) {
      const msg =
        (e as ApiError)?.message ?? e?.message ?? 'Could not save profile. Please try again.';
      Alert.alert('Save failed', msg);
    } finally {
      if (isMounted()) setSaving(false);
    }
  });

  const handlePickedUri = async (localUri: string) => {
    // Optimistic local preview while we upload
    setAvatar(localUri);

    setUploading(true);
    try {
      const updated = await authService.uploadAvatar(localUri);
      if (!isMounted()) return;
      dispatch(setUser(updated as any));
      setAvatar(updated.avatar ?? localUri);
    } catch (e: any) {
      // Server may not have Cloudinary configured (returns 503 with friendly msg).
      // Keep the local preview so the user sees their photo immediately;
      // it'll persist when uploads are configured server-side.
      const apiErr = e as ApiError;
      if (apiErr?.status === 503) {
        Alert.alert(
          'Photo saved locally',
          'Image uploads are not configured on the server yet. Your photo is visible on this device but will reset on next login.',
        );
      } else {
        Alert.alert('Upload failed', apiErr?.message ?? 'Please try again.');
      }
    } finally {
      if (isMounted()) setUploading(false);
    }
  };

  const takePhoto = async () => {
    setPickerOpen(false);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8 as any,
        cameraType: 'front',
        saveToPhotos: false,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Camera error', result.errorMessage ?? 'Could not open camera');
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) await handlePickedUri(uri);
    } catch (e: any) {
      Alert.alert('Camera unavailable', e?.message ?? 'Could not open camera');
    }
  };

  const pickFromGallery = async () => {
    setPickerOpen(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8 as any,
        selectionLimit: 1,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Gallery error', result.errorMessage ?? 'Could not open gallery');
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) await handlePickedUri(uri);
    } catch (e: any) {
      Alert.alert('Gallery unavailable', e?.message ?? 'Could not open gallery');
    }
  };

  const removeAvatar = async () => {
    setPickerOpen(false);
    if (!user) return;
    setUploading(true);
    try {
      const updated = await authService.updateProfile({ avatar: '' });
      if (!isMounted()) return;
      dispatch(setUser(updated as any));
      setAvatar(undefined);
    } catch (e: any) {
      Alert.alert('Could not remove photo', (e as ApiError)?.message ?? 'Try again.');
    } finally {
      if (isMounted()) setUploading(false);
    }
  };

  const openPicker = useThrottledCallback(() => {
    if (Platform.OS === 'ios') {
      const options = avatar
        ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
        : ['Take Photo', 'Choose from Library', 'Cancel'];
      const cancelIdx = options.length - 1;
      const destructiveIdx = avatar ? 2 : -1;
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIdx, destructiveButtonIndex: destructiveIdx },
        idx => {
          if (idx === 0) takePhoto();
          else if (idx === 1) pickFromGallery();
          else if (idx === 2 && avatar) removeAvatar();
        },
      );
    } else {
      setPickerOpen(true);
    }
  });

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Edit Profile" onBackPress={() => navigation.goBack()} />
      <KeyboardScreen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
          <Pressable
            onPress={openPicker}
            disabled={uploading}
            style={styles.avatarRow}
            hitSlop={6}
          >
            <Avatar name={fullName || 'You'} uri={avatar} size={88} />
            {uploading ? (
              <View style={[styles.cameraBtn, styles.uploadingOverlay]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View
                style={[
                  styles.cameraBtn,
                  { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
                ]}
              >
                <Icon name="camera" size={16} color="#fff" />
              </View>
            )}
          </Pressable>
          <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 8 }}>
            Tap to change photo
          </Text>

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
                  <Pressable
                    key={c}
                    onPress={() => setCity(c)}
                    style={[
                      styles.cityChip,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      weight="600"
                      style={{ color: active ? '#fff' : theme.colors.text }}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <View style={{ marginTop: 28 }}>
            <GradientButton
              title="Save Changes"
              loading={saving}
              onPress={onSave}
              size="lg"
            />
          </View>
      </KeyboardScreen>

      {/* Android picker action sheet */}
      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Change profile photo"
      >
        <Pressable
          onPress={takePhoto}
          style={[styles.actionRow, { borderColor: theme.colors.divider }]}
          android_ripple={{ color: theme.colors.primary + '14' }}
        >
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '14' }]}>
            <Icon name="camera-outline" size={22} color={theme.colors.primary} />
          </View>
          <Text variant="bodyLg" weight="600" style={{ marginLeft: 12, flex: 1 }}>
            Take Photo
          </Text>
          <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={pickFromGallery}
          style={[styles.actionRow, { borderColor: theme.colors.divider }]}
          android_ripple={{ color: theme.colors.accent + '14' }}
        >
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.accent + '22' }]}>
            <Icon name="images-outline" size={22} color={theme.colors.accentDark} />
          </View>
          <Text variant="bodyLg" weight="600" style={{ marginLeft: 12, flex: 1 }}>
            Choose from Gallery
          </Text>
          <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>
        {!!avatar && (
          <Pressable
            onPress={removeAvatar}
            style={[styles.actionRow, { borderColor: theme.colors.divider }]}
            android_ripple={{ color: theme.colors.error + '14' }}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.error + '14' }]}>
              <Icon name="trash-outline" size={22} color={theme.colors.error} />
            </View>
            <Text variant="bodyLg" weight="600" style={{ marginLeft: 12, flex: 1, color: theme.colors.error }}>
              Remove Photo
            </Text>
          </Pressable>
        )}
      </BottomSheet>
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
  uploadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderColor: 'transparent',
    width: 88,
    height: 88,
    borderRadius: 44,
    bottom: 0,
    right: 0,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

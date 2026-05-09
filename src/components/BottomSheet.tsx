import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Text } from './Text';
import { SCREEN_HEIGHT } from '../utils/dimensions';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
  contentStyle?: ViewStyle;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  maxHeight = SCREEN_HEIGHT * 0.85,
  contentStyle,
}) => {
  const theme = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      opacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, translateY, opacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
          <Pressable
            onPress={onClose}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.overlay },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius['2xl'],
              borderTopRightRadius: theme.radius['2xl'],
              maxHeight,
            },
            sheetStyle,
            contentStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          {title && (
            <Text variant="h3" weight="700" style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              {title}
            </Text>
          )}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
});

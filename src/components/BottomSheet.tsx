import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
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

/**
 * Bottom sheet using Modal's native "slide" animation. Avoids known
 * Reanimated v4 + Modal worklet context issues that caused contents
 * to remain off-screen on Android.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  maxHeight = SCREEN_HEIGHT * 0.85,
  contentStyle,
}) => {
  const theme = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Tap-to-close overlay (sits BEHIND the sheet because the sheet renders later in the tree) */}
        <Pressable
          onPress={onClose}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.overlay },
          ]}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius['2xl'],
              borderTopRightRadius: theme.radius['2xl'],
              maxHeight,
            },
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
        </View>
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

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const theme = useTheme();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface PropertyCardSkeletonProps {
  width?: number | `${number}%`;
}

export const PropertyCardSkeleton: React.FC<PropertyCardSkeletonProps> = ({
  width = '100%',
}) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          width: width as any,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          ...theme.shadows.sm,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <SkeletonLoader height={180} borderRadius={theme.radius.lg} />
      <View style={{ padding: 14 }}>
        <SkeletonLoader width="60%" height={16} />
        <View style={{ height: 8 }} />
        <SkeletonLoader width="90%" height={12} />
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonLoader width={90} height={14} />
          <SkeletonLoader width={60} height={14} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginBottom: 16,
  },
});

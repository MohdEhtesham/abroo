import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  /** Distance in px to slide from. Default 12. */
  from?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Wraps children in an Animated.View that fades + slides in on mount.
 * Snappy by default so cascades don't feel sluggish.
 */
export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  children,
  delay = 0,
  duration = 350,
  from = 12,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(from);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [opacity, translateY, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animatedStyle, style as any]}>{children}</Animated.View>;
};

import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  /** Distance in px to slide from. Default 12. */
  from?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Wrapper that fades + slides children in on mount using Reanimated v4
 * layout animations. Native-driven and reliable inside any context.
 */
export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  children,
  delay = 0,
  duration = 350,
  from = 12,
  style,
}) => {
  const entering = FadeInDown.delay(delay).duration(duration).withInitialValues({
    opacity: 0,
    transform: [{ translateY: from }],
  });

  return (
    <Animated.View style={style as any} entering={entering}>
      {children}
    </Animated.View>
  );
};

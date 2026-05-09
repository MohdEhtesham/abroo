import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Three softly-glowing gradient orbs that float and pulse continuously inside
 * the auth hero gradient. Adds depth and motion without being distracting.
 */
export const AuthBackgroundOrbs: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Orb
        size={220}
        top={-60}
        left={-80}
        startColor="rgba(212,175,55,0.35)"
        endColor="rgba(212,175,55,0)"
        floatX={20}
        floatY={30}
        duration={6000}
        delay={0}
      />
      <Orb
        size={180}
        top={40}
        right={-60}
        startColor="rgba(255,255,255,0.16)"
        endColor="rgba(255,255,255,0)"
        floatX={-25}
        floatY={20}
        duration={7500}
        delay={1200}
      />
      <Orb
        size={140}
        bottom={-30}
        left={60}
        startColor={`${accentColor}55`}
        endColor={`${accentColor}00`}
        floatX={15}
        floatY={-25}
        duration={5500}
        delay={2400}
      />
    </View>
  );
};

interface OrbProps {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  startColor: string;
  endColor: string;
  floatX: number;
  floatY: number;
  duration: number;
  delay: number;
}

const Orb: React.FC<OrbProps> = ({
  size,
  top,
  bottom,
  left,
  right,
  startColor,
  endColor,
  floatX,
  floatY,
  duration,
  delay,
}) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    tx.value = withRepeat(
      withSequence(
        withTiming(floatX, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-floatX, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(floatY, { duration: duration * 0.85, easing: Easing.inOut(Easing.sin) }),
        withTiming(-floatY, { duration: duration * 0.85, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    // initial offset to phase orbs differently
    setTimeout(() => {}, delay);
  }, [tx, ty, scale, floatX, floatY, duration, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const pos: any = { position: 'absolute' };
  if (top !== undefined) pos.top = top;
  if (bottom !== undefined) pos.bottom = bottom;
  if (left !== undefined) pos.left = left;
  if (right !== undefined) pos.right = right;

  return (
    <Animated.View style={[pos, { width: size, height: size }, style]}>
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size / 2,
        }}
      />
    </Animated.View>
  );
};

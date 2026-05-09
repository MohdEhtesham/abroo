import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../components';
import { APP_NAME, COMPANY } from '../../../constants';
import { useTheme } from '../../../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const theme = useTheme();
  const scale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.7);
  const ringOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    logoOpacity.value = withTiming(1, { duration: 500 });

    ringOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    ringScale.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1.25, { duration: 1400, easing: Easing.out(Easing.ease) }),
          withTiming(0.7, { duration: 0 }),
        ),
        -1,
      ),
    );

    titleY.value = withDelay(350, withTiming(0, { duration: 600, easing: Easing.out(Easing.exp) }));
    titleOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));
    dotsOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));

    const t = setTimeout(onFinish, 2200);
    return () => clearTimeout(t);
  }, [
    scale, logoOpacity, ringScale, ringOpacity,
    titleY, titleOpacity, taglineOpacity, dotsOpacity, onFinish,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: logoOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value * (1 - (ringScale.value - 0.7) / 0.55),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary, '#0F1F4D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating gold particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <Particle key={i} index={i} accent={theme.colors.accent} />
      ))}

      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: theme.colors.accent },
              ringStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.colors.accent },
              logoStyle,
            ]}
          >
            <Icon name="home" size={44} color="#fff" />
          </Animated.View>
        </View>

        <Animated.View style={titleStyle}>
          <Text variant="displayMd" weight="800" align="center" style={styles.brand}>
            {APP_NAME}
          </Text>
        </Animated.View>

        <Animated.View style={taglineStyle}>
          <View style={styles.taglineRow}>
            <View style={[styles.taglineDash, { backgroundColor: theme.colors.accent }]} />
            <Text variant="bodySm" weight="700" style={styles.tagline}>
              DISCOVER LUXURY LIVING
            </Text>
            <View style={[styles.taglineDash, { backgroundColor: theme.colors.accent }]} />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.dots, dotsStyle]}>
        {[0, 1, 2].map(i => (
          <LoadingDot key={i} delay={i * 180} accent={theme.colors.accent} />
        ))}
      </Animated.View>

      <Text variant="caption" style={styles.footer}>
        {COMPANY}
      </Text>
    </View>
  );
};

const Particle: React.FC<{ index: number; accent: string }> = ({ index, accent }) => {
  const startY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const drift = useSharedValue(0);

  // Pre-computed but stable per-particle attributes
  const cfg = React.useMemo(() => {
    const left = (index * 73) % 100; // 0-99 percent
    const size = 3 + (index % 3) * 2; // 3, 5, 7
    const speedMs = 6000 + (index * 311) % 4000; // 6-10s
    const delay = (index * 220) % 4000;
    const driftAmount = 18 + (index % 4) * 10;
    return { left, size, speedMs, delay, driftAmount };
  }, [index]);

  useEffect(() => {
    startY.value = 0;
    startY.value = withDelay(
      cfg.delay,
      withRepeat(
        withSequence(
          withTiming(-1, { duration: cfg.speedMs, easing: Easing.linear }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      cfg.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: cfg.speedMs * 0.25 }),
          withTiming(0, { duration: cfg.speedMs * 0.75 }),
        ),
        -1,
      ),
    );
    drift.value = withRepeat(
      withSequence(
        withTiming(cfg.driftAmount, { duration: cfg.speedMs * 0.5, easing: Easing.inOut(Easing.sin) }),
        withTiming(-cfg.driftAmount, { duration: cfg.speedMs * 0.5, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [startY, opacity, drift, cfg]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: startY.value * 720 }, // travel up across screen height
      { translateX: drift.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: -20,
          left: `${cfg.left}%`,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size / 2,
          backgroundColor: accent,
        },
        style,
      ]}
    />
  );
};

const LoadingDot: React.FC<{ delay: number; accent: string }> = ({ delay, accent }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 }),
        ),
        -1,
      ),
    );
  }, [opacity, delay]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: accent }, style]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoArea: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  brand: {
    color: '#fff',
    marginTop: 28,
    letterSpacing: -0.5,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  taglineDash: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 10,
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 3.5,
    fontSize: 11,
  },
  dots: {
    position: 'absolute',
    bottom: 84,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
  },
});

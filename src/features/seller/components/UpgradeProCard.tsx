import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../components';
import { useTheme } from '../../../theme';
import { SCREEN_WIDTH } from '../../../utils/dimensions';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface UpgradeProCardProps {
  onPress: () => void;
}

export const UpgradeProCard: React.FC<UpgradeProCardProps> = ({ onPress }) => {
  const theme = useTheme();

  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-1);
  const rocketY = useSharedValue(0);
  const rocketRotate = useSharedValue(0);
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);

  useEffect(() => {
    // Shimmer sweep: -1 (off-card left) → 1 (off-card right), every 3.5s
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(-1, { duration: 0 }),
        withTiming(-1, { duration: 2100 }),
      ),
      -1,
    );

    // Rocket gentle float (bob up-down + slight tilt)
    rocketY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    rocketRotate.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Sparkles pulse (offset by phases)
    sparkle1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    sparkle2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 700 }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [shimmerX, rocketY, rocketRotate, sparkle1, sparkle2]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardWidth = SCREEN_WIDTH - 40;

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [-1, 1], [-cardWidth, cardWidth]) }],
  }));

  const rocketStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: rocketY.value },
      { rotate: `${rocketRotate.value}deg` },
    ],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1.value,
    transform: [{ scale: 0.6 + sparkle1.value * 0.6 }],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2.value,
    transform: [{ scale: 0.6 + sparkle2.value * 0.6 }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 14, stiffness: 220 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrap, cardStyle]}
    >
      <LinearGradient
        colors={['#0F1F4D', theme.colors.primary, '#1A2D6E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Gold left accent stripe */}
        <LinearGradient
          colors={[theme.colors.accent, theme.colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accentStripe}
        />

        {/* Shimmer sweep */}
        <Animated.View style={[styles.shimmerWrap, shimmerStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>

        {/* Decorative sparkles */}
        <Animated.View style={[styles.sparkle, { top: 14, right: 60 }, sparkle1Style]}>
          <Icon name="sparkles" size={12} color={theme.colors.accent} />
        </Animated.View>
        <Animated.View style={[styles.sparkle, { bottom: 18, right: 90 }, sparkle2Style]}>
          <Icon name="sparkles" size={10} color="#FFFFFF" />
        </Animated.View>

        {/* POPULAR badge */}
        <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
          <Icon name="star" size={10} color="#fff" />
          <Text variant="caption" weight="800" style={styles.badgeText}>
            POPULAR
          </Text>
        </View>

        <View style={styles.content}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Animated.View style={rocketStyle}>
                <View style={[styles.rocketWrap, { backgroundColor: theme.colors.accent + '22' }]}>
                  <Icon name="rocket" size={20} color={theme.colors.accent} />
                </View>
              </Animated.View>
              <View style={{ marginLeft: 12 }}>
                <Text
                  variant="caption"
                  weight="700"
                  style={{ color: theme.colors.accent, letterSpacing: 1.4 }}
                >
                  AABROO PRO
                </Text>
                <Text weight="800" style={{ color: '#fff', fontSize: 19, marginTop: 1 }}>
                  Sell 3.4x faster
                </Text>
              </View>
            </View>

            <View style={styles.featuresRow}>
              <FeatureChip icon="infinite" label="Unlimited" />
              <FeatureChip icon="trending-up" label="Featured" />
              <FeatureChip icon="shield-checkmark" label="Verified" />
            </View>

            <View style={styles.footer}>
              <View>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Starting at
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 }}>
                  <Text weight="800" style={{ color: '#fff', fontSize: 22, lineHeight: 24 }}>
                    ₹499
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', marginLeft: 4, fontSize: 12 }}>
                    /month
                  </Text>
                </View>
              </View>

              <LinearGradient
                colors={[theme.colors.accent, theme.colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text weight="800" style={{ color: '#fff', fontSize: 13, letterSpacing: 0.4 }}>
                  Upgrade
                </Text>
                <Icon name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 5 }} />
              </LinearGradient>
            </View>
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const FeatureChip: React.FC<{ icon: string; label: string }> = ({ icon, label }) => {
  const theme = useTheme();
  return (
    <View style={styles.chip}>
      <Icon name={icon as any} size={11} color={theme.colors.accent} />
      <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 5, fontSize: 11 }}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 14,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingLeft: 22,
    paddingRight: 16,
    paddingVertical: 18,
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '70%',
  },
  shimmer: {
    flex: 1,
    transform: [{ skewX: '-18deg' }],
  },
  sparkle: {
    position: 'absolute',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  content: {
    flexDirection: 'row',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rocketWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  featuresRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

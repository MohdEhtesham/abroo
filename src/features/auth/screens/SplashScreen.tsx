import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) });
    opacity.value = withDelay(150, withTiming(1, { duration: 600 }));
    const t = setTimeout(onFinish, 1900);
    return () => clearTimeout(t);
  }, [scale, opacity, onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary, '#0F1F4D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[styles.content, logoStyle]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
          <Icon name="home" size={44} color="#fff" />
        </View>
        <Text variant="displayMd" weight="800" style={{ color: '#fff', marginTop: 24, letterSpacing: -0.5 }}>
          {APP_NAME}
        </Text>
        <Text variant="bodySm" style={{ color: theme.colors.accent, marginTop: 8, letterSpacing: 4 }}>
          DISCOVER LUXURY LIVING
        </Text>
      </Animated.View>
      <Text variant="caption" style={styles.footer}>
        {COMPANY}
      </Text>
    </View>
  );
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
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
  },
});

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  iconName?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  iconName,
  iconPosition = 'right',
  fullWidth = true,
  style,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const heights = { sm: 40, md: 52, lg: 58 };
  const fontSize = { sm: 14, md: 16, lg: 17 };
  const isInteractive = !disabled && !loading;

  const gradients: Record<string, [string, string]> = {
    primary: [theme.colors.primary, theme.colors.primaryDark],
    accent: [theme.colors.accent, theme.colors.accentDark],
  };

  const renderInner = () => (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#fff'} />
      ) : (
        <>
          {iconName && iconPosition === 'left' && (
            <Icon
              name={iconName}
              size={fontSize[size] + 2}
              color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#fff'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            weight="600"
            style={{
              color: variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#fff',
              fontSize: fontSize[size],
              letterSpacing: 0.3,
            }}
          >
            {title}
          </Text>
          {iconName && iconPosition === 'right' && (
            <Icon
              name={iconName}
              size={fontSize[size] + 2}
              color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#fff'}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </View>
  );

  const containerStyle: ViewStyle = {
    height: heights[size],
    borderRadius: theme.radius.base,
    width: fullWidth ? '100%' : undefined,
    opacity: isInteractive ? 1 : 0.55,
    overflow: 'hidden',
  };

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPress={isInteractive ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          containerStyle,
          {
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
          },
          animatedStyle,
          style,
        ]}
      >
        {renderInner()}
      </AnimatedPressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={isInteractive ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          containerStyle,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
          },
          animatedStyle,
          style,
        ]}
      >
        {renderInner()}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={isInteractive ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, animatedStyle, style]}
    >
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.center]}
      >
        {renderInner()}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

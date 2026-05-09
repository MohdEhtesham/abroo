import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  padding = 16,
  style,
  elevated = true,
}) => {
  const theme = useTheme();
  const inner = (
    <View
      style={[
        styles.card,
        {
          padding,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.divider,
          ...(elevated ? theme.shadows.sm : {}),
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});

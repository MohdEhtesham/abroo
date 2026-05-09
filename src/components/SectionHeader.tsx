import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  style,
}) => {
  const theme = useTheme();
  return (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        <Text variant="h3" weight="700">{title}</Text>
        {subtitle && (
          <Text variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {actionLabel && (
        <Pressable hitSlop={8} onPress={onActionPress}>
          <Text variant="bodySm" weight="600" style={{ color: theme.colors.primary }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },
});

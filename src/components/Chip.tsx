import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  iconName?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  iconName,
  size = 'md',
  style,
}) => {
  const theme = useTheme();
  const padding = size === 'sm' ? { px: 12, py: 6 } : { px: 16, py: 9 };
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          paddingHorizontal: padding.px,
          paddingVertical: padding.py,
          borderRadius: theme.radius.full,
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}
    >
      {iconName && (
        <Icon
          name={iconName}
          size={fontSize + 2}
          color={selected ? '#fff' : theme.colors.text}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        weight="600"
        style={{
          fontSize,
          color: selected ? '#fff' : theme.colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});

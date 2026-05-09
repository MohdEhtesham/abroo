import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'accent';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
  size = 'sm',
  style,
}) => {
  const theme = useTheme();

  const tones: Record<Tone, { bg: string; fg: string }> = {
    info: { bg: theme.colors.info + '20', fg: theme.colors.info },
    success: { bg: theme.colors.success + '20', fg: theme.colors.success },
    warning: { bg: theme.colors.warning + '20', fg: theme.colors.warning },
    error: { bg: theme.colors.error + '20', fg: theme.colors.error },
    accent: { bg: theme.colors.accent + '25', fg: theme.colors.accentDark },
    neutral: { bg: theme.colors.divider, fg: theme.colors.textSecondary },
  };

  const colors = tones[tone];
  const padding = size === 'sm' ? { px: 8, py: 3 } : { px: 12, py: 6 };

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: colors.bg,
          paddingHorizontal: padding.px,
          paddingVertical: padding.py,
          borderRadius: theme.radius.full,
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        weight="600"
        style={{ color: colors.fg, fontSize: size === 'sm' ? 11 : 12 }}
      >
        {label}
      </Text>
    </View>
  );
};

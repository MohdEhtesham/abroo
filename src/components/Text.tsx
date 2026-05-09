import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../theme';

type Variant =
  | 'displayLg'
  | 'displayMd'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'overline';

type Color = 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'accent' | 'error' | 'success' | 'warning' | 'inverse';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: Color;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: TextStyle['textAlign'];
  style?: TextStyle | TextStyle[];
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'text',
  weight,
  align,
  style,
  children,
  ...rest
}) => {
  const theme = useTheme();
  const base = theme.textStyles[variant];

  const colorMap: Record<Color, string> = {
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    textMuted: theme.colors.textMuted,
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
    inverse: theme.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',
  };

  return (
    <RNText
      style={[
        base,
        { color: colorMap[color] },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style as TextStyle,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

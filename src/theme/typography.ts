import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
});

const fontFamilySerif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
});

export const typography = {
  fontFamily,
  fontFamilySerif,
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    heavy: '800' as TextStyle['fontWeight'],
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeights: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const textStyles = {
  displayLg: {
    fontFamily,
    fontSize: typography.sizes['5xl'],
    fontWeight: typography.weights.heavy,
    letterSpacing: -1,
  } as TextStyle,
  displayMd: {
    fontFamily,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  } as TextStyle,
  h1: {
    fontFamily,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: -0.3,
  } as TextStyle,
  h2: {
    fontFamily,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  } as TextStyle,
  h3: {
    fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
  h4: {
    fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
  bodyLg: {
    fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
  } as TextStyle,
  bodySm: {
    fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.3,
  } as TextStyle,
  overline: {
    fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
};

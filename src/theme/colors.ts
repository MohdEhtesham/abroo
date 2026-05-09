export const palette = {
  royalBlue: '#1E3A8A',
  royalBlueDark: '#152C6B',
  royalBlueLight: '#3B5BB8',
  gold: '#D4AF37',
  goldDark: '#B5942C',
  goldLight: '#F2D77A',
  white: '#FFFFFF',
  black: '#0A0A0A',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  overlay: string;
  shadow: string;
  skeleton: string;
  skeletonHighlight: string;
  tabActive: string;
  tabInactive: string;
}

export const lightColors: ThemeColors = {
  primary: palette.royalBlue,
  primaryDark: palette.royalBlueDark,
  primaryLight: palette.royalBlueLight,
  accent: palette.gold,
  accentDark: palette.goldDark,
  background: palette.gray50,
  surface: palette.white,
  surfaceElevated: palette.white,
  card: palette.white,
  text: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  border: palette.gray200,
  divider: palette.gray100,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  overlay: palette.overlay,
  shadow: '#000000',
  skeleton: palette.gray200,
  skeletonHighlight: palette.gray100,
  tabActive: palette.royalBlue,
  tabInactive: palette.gray400,
};

export const darkColors: ThemeColors = {
  primary: palette.royalBlueLight,
  primaryDark: palette.royalBlue,
  primaryLight: '#5B7BD8',
  accent: palette.goldLight,
  accentDark: palette.gold,
  background: '#0B1020',
  surface: '#141B30',
  surfaceElevated: '#1B233D',
  card: '#1B233D',
  text: palette.white,
  textSecondary: palette.gray300,
  textMuted: palette.gray500,
  border: '#2A3450',
  divider: '#1F2940',
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
  skeleton: '#1F2940',
  skeletonHighlight: '#2A3450',
  tabActive: palette.goldLight,
  tabInactive: palette.gray500,
};

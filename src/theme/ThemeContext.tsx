import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { ThemeColors, darkColors, lightColors } from './colors';
import { spacing, radius, shadows } from './spacing';
import { textStyles, typography } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppTheme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  typography: typeof typography;
  textStyles: typeof textStyles;
}

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const buildTheme = (mode: 'light' | 'dark'): AppTheme => ({
  mode,
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  shadows,
  typography,
  textStyles,
});

const defaultTheme = buildTheme('light');

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  mode: 'system',
  setMode: () => {},
  toggleMode: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const theme = useMemo(() => buildTheme(resolvedMode), [resolvedMode]);

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, mode, setMode, toggleMode }),
    [theme, mode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): AppTheme => useContext(ThemeContext).theme;
export const useThemeMode = () => {
  const { mode, setMode, toggleMode } = useContext(ThemeContext);
  return { mode, setMode, toggleMode };
};

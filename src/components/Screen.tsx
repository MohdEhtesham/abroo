import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  background?: string;
  padded?: boolean;
  style?: ViewStyle;
  hideStatusBar?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  background,
  padded = false,
  style,
  hideStatusBar = false,
}) => {
  const theme = useTheme();
  const bg = background ?? theme.colors.background;
  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.flex,
        { backgroundColor: bg },
        padded ? { paddingHorizontal: theme.spacing.lg } : null,
        style,
      ]}
    >
      <StatusBar
        hidden={hideStatusBar}
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { darkColors, lightColors, spacing } from '../theme';
import { Text } from './Text';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional callback so the error can be reported to a service like Sentry. */
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches synchronous render errors anywhere in the
 * tree below it and shows a non-fatal recovery UI instead of the red box (dev)
 * or a white screen (prod). Async errors and event-handler errors are NOT
 * caught here — those are handled by global handlers in apiClient + services.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Always log so devs can see in metro/logcat
    console.error('[ErrorBoundary] caught:', error, info?.componentStack);
    this.props.onError?.(error, { componentStack: info?.componentStack ?? '' });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error; onReset: () => void }> = ({
  error,
  onReset,
}) => {
  // Theme context may itself have failed — fall back to static palette
  const colors = lightColors;

  return (
    <LinearGradient
      colors={[colors.background, colors.surface]}
      style={styles.container}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.error + '14' }]}>
        <Icon name="alert-circle" size={48} color={colors.error} />
      </View>
      <Text variant="h2" weight="800" align="center" style={{ marginTop: spacing.lg }}>
        Something went wrong
      </Text>
      <Text
        variant="body"
        color="textSecondary"
        align="center"
        style={{ marginTop: spacing.sm, paddingHorizontal: spacing['2xl'], lineHeight: 22 }}
      >
        We hit an unexpected issue. The team has been notified — please try again.
      </Text>

      {__DEV__ && (
        <ScrollView
          style={[styles.devTrace, { backgroundColor: colors.surface, borderColor: colors.border }]}
          contentContainerStyle={{ padding: spacing.base }}
        >
          <Text variant="caption" weight="700" style={{ marginBottom: spacing.xs }}>
            DEV: {error.name}
          </Text>
          <Text variant="caption" color="textSecondary" selectable>
            {error.message}
            {'\n\n'}
            {error.stack}
          </Text>
        </ScrollView>
      )}

      <Pressable
        onPress={onReset}
        style={[styles.button, { backgroundColor: colors.primary }]}
        android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      >
        <Icon name="refresh" size={18} color="#fff" />
        <Text weight="700" style={{ color: '#fff', marginLeft: 8 }}>
          Try again
        </Text>
      </Pressable>
    </LinearGradient>
  );
};

// Touch import so unused colors don't get tree-shaken in jest
void darkColors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devTrace: {
    width: '100%',
    maxHeight: 220,
    marginTop: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 180,
  },
});

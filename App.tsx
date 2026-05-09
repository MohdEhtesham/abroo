import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation';
import { setOnUnauthorized } from './src/services/apiClient';
import { store } from './src/store';
import {
  forceLogoutThunk,
  rehydrateAuthThunk,
} from './src/store/slices/authSlice';
import { ThemeProvider } from './src/theme';

/** Bootstrapper: rehydrate persisted auth + wire 401 → forced logout. */
const Bootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Restore session from disk
    store.dispatch(rehydrateAuthThunk());

    // Server says token is invalid → drop the session and let the navigator
    // route us back to the auth stack on the next render.
    setOnUnauthorized(() => {
      store.dispatch(forceLogoutThunk());
    });

    return () => setOnUnauthorized(null);
  }, []);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ReduxProvider store={store}>
          <SafeAreaProvider>
            <ThemeProvider>
              <Bootstrap>
                <RootNavigator />
              </Bootstrap>
            </ThemeProvider>
          </SafeAreaProvider>
        </ReduxProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

export default App;

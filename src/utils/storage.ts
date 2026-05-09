import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../features/auth/types';

const KEY_ONBOARDING_SEEN = '@aabroo:onboarding_seen';
const KEY_AUTH = '@aabroo:auth';

interface PersistedAuth {
  token: string;
  user: User;
}

/**
 * Tiny storage wrapper. All methods are crash-safe — they catch and log errors
 * instead of throwing, so storage failures never bring down the app.
 */
export const storage = {
  // --- Onboarding flag ---
  getOnboardingSeen: async (): Promise<boolean> => {
    try {
      const v = await AsyncStorage.getItem(KEY_ONBOARDING_SEEN);
      return v === '1';
    } catch (e) {
      console.warn('[storage] getOnboardingSeen failed', e);
      return false;
    }
  },

  setOnboardingSeen: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEY_ONBOARDING_SEEN, '1');
    } catch (e) {
      console.warn('[storage] setOnboardingSeen failed', e);
    }
  },

  // --- Auth ---
  getAuth: async (): Promise<PersistedAuth | null> => {
    try {
      const raw = await AsyncStorage.getItem(KEY_AUTH);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedAuth;
      if (!parsed?.token || !parsed?.user) return null;
      return parsed;
    } catch (e) {
      console.warn('[storage] getAuth failed', e);
      return null;
    }
  },

  saveAuth: async (auth: PersistedAuth): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEY_AUTH, JSON.stringify(auth));
    } catch (e) {
      console.warn('[storage] saveAuth failed', e);
    }
  },

  clearAuth: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEY_AUTH);
    } catch (e) {
      console.warn('[storage] clearAuth failed', e);
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('[storage] clearAll failed', e);
    }
  },
};

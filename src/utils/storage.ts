import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ONBOARDING_SEEN = '@aabroo:onboarding_seen';

export const storage = {
  getOnboardingSeen: async (): Promise<boolean> => {
    try {
      const v = await AsyncStorage.getItem(KEY_ONBOARDING_SEEN);
      return v === '1';
    } catch {
      return false;
    }
  },

  setOnboardingSeen: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEY_ONBOARDING_SEEN, '1');
    } catch {
      // ignore — onboarding will just show again next launch
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch {
      // ignore
    }
  },
};

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  systemScheme: ResolvedScheme;
  setMode: (mode: ThemeMode) => void;
  resolvedScheme: () => ResolvedScheme;
}

function normalize(scheme: ColorSchemeName | null | undefined): ResolvedScheme {
  return scheme === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      systemScheme: normalize(Appearance.getColorScheme()),

      setMode: (mode) => set({ mode }),

      resolvedScheme: () => {
        const { mode, systemScheme } = get();
        return mode === 'system' ? systemScheme : mode;
      },
    }),
    {
      name: 'higo-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

Appearance.addChangeListener(({ colorScheme }) => {
  useThemeStore.setState({ systemScheme: normalize(colorScheme) });
});

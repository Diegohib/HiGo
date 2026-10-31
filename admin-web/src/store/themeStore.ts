import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'higo-admin-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const initial = getInitialTheme();
applyTheme(initial);

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: initial,
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    set({ theme: next });
  },
}));

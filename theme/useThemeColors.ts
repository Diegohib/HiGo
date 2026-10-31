import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, ThemeColors } from './colors';

export function useThemeColors(): ThemeColors {
  const scheme = useThemeStore((s) => s.resolvedScheme());
  return scheme === 'dark' ? darkColors : lightColors;
}

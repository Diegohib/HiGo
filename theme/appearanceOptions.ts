import { Ionicons } from '@expo/vector-icons';
import { ThemeMode } from '../store/themeStore';

export const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light',  label: 'Claro',   icon: 'sunny-outline' },
  { mode: 'dark',   label: 'Oscuro',  icon: 'moon-outline' },
  { mode: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
];

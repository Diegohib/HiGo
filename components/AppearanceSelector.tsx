import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS } from '../theme/elevation';
import { APPEARANCE_OPTIONS } from '../theme/appearanceOptions';

// ─── Selector de apariencia (Claro / Oscuro / Sistema) ─────────────────────────
// Control segmentado simple — ícono + texto, la opción activa se llena del
// color de marca. Antes cada opción era una tarjeta con una mini vista previa
// de pantalla + radio button + ícono + texto, que se sentía recargado para
// una elección tan simple. Reutilizado en Cuenta y en el Perfil de cada rol.

export default function AppearanceSelector({ accentColor }: { accentColor?: string }) {
  const C = useThemeColors();
  const mode    = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const accent  = accentColor ?? C.primary;
  const styles  = makeStyles(C);

  return (
    <View style={styles.track}>
      {APPEARANCE_OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <TouchableOpacity
            key={opt.mode}
            style={[styles.segment, active && { backgroundColor: accent }]}
            activeOpacity={0.85}
            onPress={() => setMode(opt.mode)}
          >
            <Ionicons name={opt.icon} size={15} color={active ? '#FFFFFF' : C.textFaint} />
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: C.background,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  label: { fontSize: 12.5, fontWeight: '700', color: C.textFaint },
  labelActive: { color: '#FFFFFF' },
});

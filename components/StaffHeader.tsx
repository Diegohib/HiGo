import { ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './Text';
import Avatar from './Avatar';
import { HiGoMark } from './HiGoLogo';
import { HERO_GRADIENT } from './AuthLayout';

// ─── Encabezado de los paneles del personal ───────────────────────────────────
// Mismo lenguaje que las pantallas de acceso: degradado morado con luz, el
// higo como marca de agua y el texto en blanco. Lo comparten cochero,
// transportista y comerciante. `children` va debajo de la fila del saludo
// (por ejemplo, el aviso de pedidos por preparar del comerciante).

export const STAFF_HEADER_TOP = HERO_GRADIENT[0];

export default function StaffHeader({
  name, photoUri, roleLabel, available, onToggleAvailable, padTop = true, children,
}: {
  name:              string;
  photoUri?:         string;
  roleLabel:         string;
  available:         boolean;
  onToggleAvailable: () => void;
  // false cuando la pantalla ya está dentro de un SafeAreaView.
  padTop?:           boolean;
  children?:         ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={HERO_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[s.header, { paddingTop: (padTop ? insets.top : 0) + 14 }]}
    >
      <View style={s.glow} pointerEvents="none" />
      <View style={s.watermark} pointerEvents="none">
        <HiGoMark size={150} color="#FFFFFF" />
      </View>

      <View style={s.row}>
        <View style={s.avatarRing}>
          <Avatar name={name} photoUri={photoUri} size={44} bg="rgba(255,255,255,0.18)" />
        </View>
        <View style={s.texts}>
          <Text style={s.role}>{roleLabel}</Text>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
        </View>
        <TouchableOpacity
          style={[s.pill, !available && s.pillOff]}
          activeOpacity={0.8}
          onPress={onToggleAvailable}
          accessibilityRole="switch"
          accessibilityState={{ checked: available }}
        >
          <View style={[s.dot, !available && s.dotOff]} />
          <Text style={s.pillText}>{available ? 'Disponible' : 'En pausa'}</Text>
        </TouchableOpacity>
      </View>

      {children}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(196,165,255,0.28)',
  },
  watermark: {
    position: 'absolute',
    right: -36,
    bottom: -48,
    opacity: 0.07,
    transform: [{ rotate: '-12deg' }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  texts: { flex: 1, minWidth: 0 },
  role: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#E9D5FF',
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  pillOff: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  dotOff: { backgroundColor: 'rgba(255,255,255,0.45)' },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

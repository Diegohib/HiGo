import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StaffRole } from '../navigation/types';
import { AuthScreen, AuthTextLink } from '../components/AuthLayout';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/elevation';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

type RoleCard = {
  id:          StaffRole;
  label:       string;
  description: string;
  icon:        keyof typeof Ionicons.glyphMap;
  dashboard:   keyof RootStackParamList;
};

// Mismo orden que recorre un pedido: el comerciante lo prepara, el cochero lo
// junta en el mercado y el transportista lo lleva.
const ROLES: RoleCard[] = [
  { id: 'comerciante',   label: 'Comerciante',   icon: 'storefront', dashboard: 'ComercianteDashboard',
    description: 'Tengo un puesto en el mercado y preparo los pedidos.' },
  { id: 'cochero',       label: 'Cochero',       icon: 'bicycle',    dashboard: 'CocheroDashboard',
    description: 'Recojo los pedidos en cada puesto y los junto.' },
  { id: 'transportista', label: 'Transportista', icon: 'car',        dashboard: 'TransportistaDashboard',
    description: 'Llevo los pedidos del mercado a cada cliente.' },
];

export default function RoleSelectionScreen({ navigation }: Props) {
  const C = useThemeColors();
  const s = makeStyles(C);

  return (
    <AuthScreen
      eyebrow="Trabaja con HiGo"
      title="¿Cuál es tu rol?"
      subtitle="Elige cómo vas a trabajar en el Mercado Mayorista."
      onBack={() => navigation.goBack()}
    >
      <View style={s.list}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('StaffRegister', { role: role.id })}
          >
            <View style={s.iconBox}>
              <Ionicons name={role.icon} size={22} color={C.primary} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>{role.label}</Text>
              <Text style={s.cardDesc}>{role.description}</Text>
            </View>
            {/* Solo para revisar el diseño del panel sin crear una cuenta */}
            <TouchableOpacity
              style={s.previewBtn}
              activeOpacity={0.7}
              hitSlop={8}
              accessibilityLabel={`Ver panel de ${role.label}`}
              onPress={() => navigation.navigate(role.dashboard as any)}
            >
              <Ionicons name="eye-outline" size={16} color={C.textFaint} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={18} color={C.textFaint} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.infoRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={C.textSoft} />
        <Text style={s.infoText}>
          Un administrador revisa tu solicitud y tus documentos en menos de 24 horas.
        </Text>
      </View>

      <AuthTextLink label="Ya tengo una cuenta" icon="log-in-outline" onPress={() => navigation.navigate('Login')} />
    </AuthScreen>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  list: { gap: SPACING.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: C.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 13, lineHeight: 18, color: C.textSoft },
  previewBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, color: C.textSoft },
});

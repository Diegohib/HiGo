import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StaffRole } from '../navigation/types';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS, SPACING, cardShadow } from '../theme/elevation';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

type RoleCard = {
  id: StaffRole; label: string; icon: string; description: string; color: string;
  ionIcon?: keyof typeof Ionicons.glyphMap; gradient?: [string, string];
  dashboard: keyof RootStackParamList;
};

const roles: RoleCard[] = [
  {
    id: 'cochero', label: 'Cochero', icon: '🚲', description: 'Llevo compras dentro del mercado', color: '#3D1F8B',
    ionIcon: 'bicycle', gradient: ['#3D1F8B', '#2D1570'], dashboard: 'CocheroDashboard',
  },
  {
    id: 'transportista', label: 'Transportista', icon: '🚚', description: 'Entrego pedidos en la ciudad', color: '#3D1F8B',
    ionIcon: 'car', gradient: ['#3D1F8B', '#2D1570'], dashboard: 'TransportistaDashboard',
  },
  {
    id: 'comerciante', label: 'Comerciante', icon: '🏪', description: 'Vendo mis productos en el mercado', color: '#3D1F8B',
    ionIcon: 'storefront', gradient: ['#3D1F8B', '#2D1570'], dashboard: 'ComercianteDashboard',
  },
];

export default function RoleSelectionScreen({ navigation }: Props) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  return (
    <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Ionicons name="briefcase-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.subtitle}>¿Cuál es tu rol?</Text>
        <Text style={styles.hint}>Seleccioná para crear tu cuenta</Text>
      </View>

      <View style={styles.rolesGrid}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('StaffRegister', { role: role.id })}
          >
            {role.ionIcon && role.gradient ? (
              <LinearGradient
                colors={role.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.iconCircle, styles.iconCircleShadow, { shadowColor: role.color }]}
              >
                <Ionicons name={role.ionIcon} size={26} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={[styles.iconCircle, { backgroundColor: `${role.color}1F` }]}>
                <Text style={styles.roleIcon}>{role.icon}</Text>
              </View>
            )}
            <View style={styles.roleText}>
              <Text style={styles.roleLabel}>{role.label}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            <TouchableOpacity
              style={styles.previewBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => { e.stopPropagation(); navigation.navigate(role.dashboard as any); }}
            >
              <Ionicons name="eye-outline" size={18} color={C.textFaint} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={C.textFaint} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Solo para revisar diseño sin tener que crear una cuenta real */}
      <View style={styles.previewHintRow}>
        <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.55)" />
        <Text style={styles.previewHint}>Tocá el ícono del ojo para ver el panel sin registrarte</Text>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  headerBadge: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.75,
  },
  rolesGrid: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...cardShadow(C),
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleIcon: {
    fontSize: 28,
  },
  iconCircleShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  roleText: {
    flex: 1,
    gap: 3,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  roleDescription: {
    fontSize: 13,
    color: C.textFaint,
    lineHeight: 18,
  },
  previewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
    marginRight: 2,
  },
  previewHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  previewHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
});

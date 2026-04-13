import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StaffRole } from '../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

const roles: { id: StaffRole; label: string; icon: string; description: string; color: string }[] = [
  { id: 'cochero',       label: 'Cochero',       icon: '🚲', description: 'Llevo compras dentro del mercado', color: '#2D7A3A' },
  { id: 'transportista', label: 'Transportista', icon: '🚚', description: 'Entrego pedidos en la ciudad',     color: '#8B6914' },
  { id: 'comerciante',   label: 'Comerciante',   icon: '🏪', description: 'Vendo mis productos en el mercado', color: '#C4623A' },
];

export default function RoleSelectionScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>¿Cuál es tu rol?</Text>
        <Text style={styles.hint}>Seleccioná para crear tu cuenta</Text>
      </View>

      <View style={styles.rolesGrid}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, { borderColor: role.color }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StaffRegister', { role: role.id })}
          >
            <View style={[styles.iconCircle, { backgroundColor: role.color }]}>
              <Text style={styles.roleIcon}>{role.icon}</Text>
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleLabel}>{role.label}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D1F8B',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  rolesGrid: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
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
  roleText: {
    flex: 1,
    gap: 3,
  },
  roleLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roleDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.7,
    lineHeight: 18,
  },
});

import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

const roles = [
  { id: 'comprador', label: 'Comprador', icon: '🛒', description: 'Comprá productos al por mayor' },
  { id: 'vendedor', label: 'Vendedor', icon: '🏪', description: 'Publicá y vendé tus productos' },
  { id: 'repartidor', label: 'Repartidor', icon: '🚚', description: 'Gestioná entregas y logística' },
  { id: 'operativo', label: 'Personal Operativo', icon: '⚙️', description: 'Administración del mercado' },
];

export default function RoleSelectionScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>HiGo</Text>
        <Text style={styles.subtitle}>¿Cómo querés usar la app?</Text>
        <Text style={styles.hint}>Seleccioná tu rol para continuar</Text>
      </View>

      <View style={styles.rolesGrid}>
        {roles.map((role) => (
          <TouchableOpacity key={role.id} style={styles.roleCard} activeOpacity={0.8}>
            <Text style={styles.roleIcon}>{role.icon}</Text>
            <Text style={styles.roleLabel}>{role.label}</Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  roleCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 24,
    width: '45%',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleIcon: {
    fontSize: 36,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
});

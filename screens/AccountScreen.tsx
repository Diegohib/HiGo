import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  primary:  '#6B3FA0',
  bg:       '#FAF7FD',
  text:     '#2D1B4E',
  sub:      '#9B8EC4',
  white:    '#FFFFFF',
  divider:  '#EDE7F6',
  chipBg:   '#EDE7F6',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  date: string;
  status: 'entregado' | 'en_camino' | 'recibido';
  total: number;
}

const ORDERS: Order[] = [
  { id: '482931', date: '24 abr 2026', status: 'entregado', total: 38.50 },
  { id: '371204', date: '21 abr 2026', status: 'en_camino', total: 62.10 },
  { id: '259867', date: '18 abr 2026', status: 'recibido',  total: 21.75 },
];

const STATUS_CONFIG = {
  entregado: { label: 'Entregado', color: '#2E7D32', bg: '#EAFAF1', icon: 'checkmark-circle' as const },
  en_camino: { label: 'En camino', color: '#E65100', bg: '#FFF3E0', icon: 'bicycle'          as const },
  recibido:  { label: 'Recibido',  color: '#1565C0', bg: '#E3F2FD', icon: 'checkmark-circle' as const },
};

// ─── Opciones de menú ─────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  danger?: boolean;
  onPress: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  console.log('USUARIO ACTUAL:', JSON.stringify(user));

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => { logout(); console.log('LOGOUT EJECUTADO'); navigation.reset({ index: 0, routes: [{ name: 'Splash' }] }); } },
      ],
      { cancelable: true }
    );
  }

  const MENU_ITEMS: MenuItem[] = [
    {
      id: 'addresses',
      label: 'Mis direcciones',
      icon: 'location-outline',
      iconBg: '#EDE7F6',
      iconColor: C.primary,
      onPress: () => {},
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: 'notifications-outline',
      iconBg: '#FFF3E0',
      iconColor: '#E65100',
      onPress: () => {},
    },
    {
      id: 'help',
      label: 'Ayuda',
      icon: 'help-circle-outline',
      iconBg: '#E3F2FD',
      iconColor: '#1565C0',
      onPress: () => {},
    },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: 'log-out-outline',
      iconBg: '#FDECEA',
      iconColor: '#C62828',
      danger: true,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Cuenta</Text>
      </View>

      {/* ── Vista invitado ── */}
      {!user ? (
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrapper}>
            <Ionicons name="person-outline" size={48} color={C.white} />
          </View>
          <Text style={styles.guestTitle}>¡Bienvenido a HiGo!</Text>
          <Text style={styles.guestSubtitle}>
            Crea tu cuenta para ver tus pedidos y gestionar tu perfil
          </Text>
          <TouchableOpacity
            style={styles.guestPrimaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.guestPrimaryBtnText}>Crear cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.guestSecondaryBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.guestSecondaryBtnText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      ) : (

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Perfil ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? 'I'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Invitado'}</Text>
            <View style={styles.profileEmailRow}>
              <Ionicons name="mail-outline" size={14} color={C.sub} />
              <Text style={styles.profileEmail}>{user?.email ?? 'Sin sesión'}</Text>
            </View>
          </View>
          <View style={styles.profileBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color={C.primary} />
            <Text style={styles.profileBadgeText}>Verificado</Text>
          </View>
        </View>

        {/* ── Pedidos recientes ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="receipt-outline" size={20} color={C.primary} />
          <Text style={styles.sectionTitle}>Mis pedidos recientes</Text>
        </View>

        {ORDERS.map((order) => {
          const cfg = STATUS_CONFIG[order.status];
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderIdLabel}>Pedido</Text>
                  <Text style={styles.orderId}>#{order.id}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                  <Text style={[styles.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <View style={styles.orderDivider} />

              <View style={styles.orderBottom}>
                <View style={styles.orderDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={C.sub} />
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}

        {/* ── Mi cuenta ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color={C.primary} />
          <Text style={styles.sectionTitle}>Mi cuenta</Text>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={item.onPress}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                  {item.label}
                </Text>
                {!item.danger && (
                  <Ionicons name="chevron-forward" size={18} color={C.sub} />
                )}
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

      </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.primary },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.white },

  scroll: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48, gap: 16 },

  // Perfil
  profileCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 24, fontWeight: '800', color: C.white },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 17, fontWeight: '700', color: C.text },
  profileEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileEmail: { fontSize: 13, color: C.sub },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.chipBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  profileBadgeText: { fontSize: 12, fontWeight: '600', color: C.primary },

  // Sección
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },

  // Tarjeta pedido
  orderCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdLabel: { fontSize: 13, color: C.sub },
  orderId: { fontSize: 15, fontWeight: '700', color: C.text },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipText: { fontSize: 13, fontWeight: '600' },
  orderDivider: { height: 1, backgroundColor: C.divider },
  orderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderDate: { fontSize: 13, color: C.sub },
  orderTotal: { fontSize: 18, fontWeight: '800', color: C.primary },

  // Vista invitado
  guestContainer: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  guestIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  guestPrimaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guestPrimaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  guestSecondaryBtnText: {
    fontSize: 15,
    color: C.primary,
    fontWeight: '600',
  },

  // Menú
  menuCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  menuIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  menuLabelDanger: {
    color: '#C62828',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginLeft: 68,
  },
});

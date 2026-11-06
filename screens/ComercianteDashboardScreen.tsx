import {
  useEffect,
  useRef,
  useState,
  ReactNode } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useComercianteStore, DaySale } from '../store/comercianteStore';
import { StallTicket, marcarListo } from '../store/stallTicketsStore';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { cardShadow, floatingShadow } from '../theme/elevation';
import { ThemeColors } from '../theme/colors';
import { pickAvatarPhoto } from '../lib/pickAvatarPhoto';
import Avatar from '../components/Avatar';
import StaffHeader from '../components/StaffHeader';
import AppearanceSelector from '../components/AppearanceSelector';
import { formatShortDate, isToday } from '../utils/earnings';
import { shortName } from '../utils/name';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ComercianteDashboard'>;
};

type Tab = 'pedidos' | 'ganancias' | 'perfil';

// Morado de marca de la app: color de este dashboard (fijo en ambos temas,
// igual que en Cochero y Transportista — los 3 comparten identidad).
const HEADER  = '#5B2BD9';
const HEADER2 = '#3D1F8B';

// ─── Entrada animada (fade + rise) reutilizada por cada tab ───────────────────

function FadeIn({ children, style }: { children: ReactNode; style?: object }) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: fade, transform: [{ translateY: rise }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Tab: Despachos ───────────────────────────────────────────────────────────

// Un ticket = lo que este puesto tiene que preparar para un pedido. El
// comerciante lo marca 'listo'; quien recoge (cochero o transportista) lo
// marca 'retirado' al llevárselo.

function TicketCard({ ticket, onListo }: { ticket: StallTicket; onListo?: () => void }) {
  const T = useThemeColors();
  const tc = makeTcStyles(T);
  const isRetirado = ticket.status === 'retirado';
  const isListo    = ticket.status === 'listo';

  const badgeColor = isRetirado ? T.success : isListo ? HEADER : T.warning;
  const badgeLabel = isRetirado ? 'Retirado' : isListo ? 'Listo' : 'Por preparar';
  const badgeIcon: keyof typeof Ionicons.glyphMap =
    isRetirado ? 'checkmark-circle' : isListo ? 'bag-check-outline' : 'time-outline';

  const pickerRoleLabel = ticket.pickerRole === 'transportista' ? 'Transportista' : 'Cochero';

  return (
    <View style={[tc.card, isRetirado && tc.cardDone]}>
      {/* Header ticket: quién retira */}
      <View style={tc.cardTop}>
        <View style={tc.cocheroRow}>
          <View style={tc.cocheroIconBox}>
            <Ionicons
              name={ticket.pickerRole === 'transportista' ? 'car-outline' : 'bicycle-outline'}
              size={22}
              color={HEADER}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={tc.cocheroName}>{ticket.pickerName || 'Esperando quién retire'}</Text>
            <Text style={tc.cocheroLabel}>
              {ticket.pickerName ? `${pickerRoleLabel} · ` : ''}
              {ticket.route === 'directa' ? 'Lo antes posible' : ticket.estimatedTime}
            </Text>
          </View>
        </View>
        <View style={[tc.statusBadge, { backgroundColor: badgeColor + '1A' }]}>
          <Ionicons name={badgeIcon} size={12} color={badgeColor} style={{ marginRight: 4 }} />
          <Text style={[tc.statusBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={tc.divider} />
      <Text style={tc.orderIdLabel}>Pedido #{ticket.orderId.slice(0, 6)}</Text>
      <View style={tc.itemsBox}>
        {ticket.items.map((item, i) => (
          <View key={i} style={tc.itemRow}>
            <View style={tc.itemDot} />
            <Text style={tc.itemText}>{item.productName}</Text>
            <Text style={tc.itemQty}>{item.quantity} {item.presentationLabel}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={tc.divider} />
      <View style={tc.cardBottom}>
        <View>
          <Text style={tc.subtotalLabel}>Subtotal</Text>
          <Text style={tc.subtotalAmount}>${ticket.subtotal.toFixed(2)}</Text>
        </View>
        {ticket.status === 'pendiente' && onListo && (
          <TouchableOpacity style={tc.confirmBtn} onPress={onListo} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            <Text style={tc.confirmBtnText}>Marcar listo</Text>
          </TouchableOpacity>
        )}
        {isListo && (
          <Text style={tc.cocheroLabel}>Esperando que lo retiren</Text>
        )}
      </View>
    </View>
  );
}

function DespachosTab() {
  const T = useThemeColors();
  const tc = makeTcStyles(T);
  const { dispatchTickets, loaded } = useComercianteStore();

  const porPreparar  = dispatchTickets.filter(t => t.status === 'pendiente');
  const listos       = dispatchTickets.filter(t => t.status === 'listo');
  const retiradosHoy = dispatchTickets.filter(t =>
    t.status === 'retirado' && t.retiradoAt != null && isToday(new Date(t.retiradoAt)));

  function handleListo(ticket: StallTicket) {
    Alert.alert(
      'Marcar listo',
      `¿Ya preparaste los productos del pedido #${ticket.orderId.slice(0, 6)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, está listo',
          onPress: () => marcarListo(ticket.id).catch((err) => {
            console.error('[ComercianteDashboard] marcar listo:', err);
            Alert.alert('Error', 'No se pudo marcar como listo. Intenta de nuevo.');
          }),
        },
      ],
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={tc.scroll} showsVerticalScrollIndicator={false}>
      <FadeIn>
        {/* Resumen del día */}
        <View style={tc.summaryRow}>
          <View style={[tc.summaryCard, { backgroundColor: T.warningFaint }]}>
            <Ionicons name="time-outline" size={18} color={HEADER} />
            <Text style={tc.summaryValue}>{porPreparar.length}</Text>
            <Text style={tc.summaryLabel}>Por preparar</Text>
          </View>
          <View style={[tc.summaryCard, { backgroundColor: T.primaryFaint }]}>
            <Ionicons name="bag-check-outline" size={18} color={HEADER} />
            <Text style={tc.summaryValue}>{listos.length}</Text>
            <Text style={tc.summaryLabel}>Listos</Text>
          </View>
          <View style={[tc.summaryCard, { backgroundColor: T.successFaint }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={T.success} />
            <Text style={[tc.summaryValue, { color: T.success }]}>{retiradosHoy.length}</Text>
            <Text style={tc.summaryLabel}>Retirados hoy</Text>
          </View>
        </View>

        {porPreparar.length > 0 && (
          <>
            <Text style={tc.groupLabel}>Por preparar</Text>
            {porPreparar.map(t => (
              <TicketCard key={t.id} ticket={t} onListo={() => handleListo(t)} />
            ))}
          </>
        )}
        {listos.length > 0 && (
          <>
            <Text style={[tc.groupLabel, { marginTop: 6 }]}>Listos para retirar</Text>
            {listos.map(t => <TicketCard key={t.id} ticket={t} />)}
          </>
        )}
        {retiradosHoy.length > 0 && (
          <>
            <Text style={[tc.groupLabel, { color: T.textFaint, marginTop: 6 }]}>Retirados hoy</Text>
            {retiradosHoy.map(t => <TicketCard key={t.id} ticket={t} />)}
          </>
        )}
        {loaded && porPreparar.length === 0 && listos.length === 0 && retiradosHoy.length === 0 && (
          <View style={tc.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={48} color={T.success} />
            <Text style={tc.emptyText}>Sin despachos pendientes hoy</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </FadeIn>
    </ScrollView>
  );
}

const makeTcStyles = (T: ThemeColors) => StyleSheet.create({
  scroll:    { padding: 16 },
  summaryRow:  { flexDirection: 'row', gap: 12, marginBottom: 18 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
  summaryValue:{ fontSize: 22, fontWeight: '900', color: HEADER },
  summaryLabel:{ fontSize: 11.5, fontWeight: '600', color: T.textSoft },
  groupLabel:{ fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: T.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    ...cardShadow(T, HEADER),
  },
  cardDone:  { opacity: 0.6 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cocheroRow:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cocheroIconBox:{ width: 42, height: 42, borderRadius: 21, backgroundColor: T.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cocheroName:   { fontSize: 15, fontWeight: '700', color: T.text },
  cocheroLabel:{ fontSize: 11, color: T.textFaint, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
  badgePending:{ backgroundColor: T.warningFaint },
  badgeDone:   { backgroundColor: T.successFaint },
  statusBadgeText: { fontSize: 11.5, fontWeight: '700' },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 12 },
  orderIdLabel:{ fontSize: 11, fontWeight: '700', color: T.textFaint, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemsBox: { gap: 7 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: HEADER2, marginRight: 9 },
  itemText:{ fontSize: 14, color: T.textSoft, flex: 1 },
  itemQty: { fontSize: 13, fontWeight: '700', color: T.text },
  cardBottom:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtotalLabel: { fontSize: 11, color: T.textFaint, marginBottom: 1 },
  subtotalAmount:{ fontWeight: '800', color: T.text, fontSize: 17 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: HEADER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyBox:  { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: T.textFaint, textAlign: 'center', marginTop: 12 },
});

// ─── Estilos compartidos por GananciasTabC ────────────────────────────────────

const makeVcStyles = (T: ThemeColors) => StyleSheet.create({
  scroll: { padding: 16 },
  summaryRow:  { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  summaryValue:{ fontSize: 22, fontWeight: '900', color: HEADER },
  summaryLabel:{ fontSize: 12, color: T.textSoft, marginTop: 4 },
  sectionTitle:{ fontSize: 14, fontWeight: '800', color: T.text, marginBottom: 12 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.surface, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: 'transparent',
    ...cardShadow(T, HEADER),
  },
  dayRowToday: { borderColor: HEADER },
  dayLeft:    { width: 92 },
  dayName:    { fontSize: 14, fontWeight: '700', color: T.text },
  dayDate:    { fontSize: 11, color: T.textFaint, marginTop: 1 },
  todayChip: { backgroundColor: HEADER, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1.5 },
  todayChipText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  barContainer:{ flex: 1, height: 8, backgroundColor: T.primaryFaint, borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 4 },
  dayRight:   { width: 72, alignItems: 'flex-end' },
  dayAmount:  { fontSize: 14, fontWeight: '800', color: T.text },
  dayOrders:  { fontSize: 11, color: T.textFaint, marginTop: 1 },
});

const makeScStyles = (T: ThemeColors) => StyleSheet.create({
  scroll: { padding: 16 },
  balanceCard: {
    borderRadius: 22, padding: 24,
    alignItems: 'center', marginBottom: 24, overflow: 'hidden',
    ...floatingShadow(T, HEADER),
  },
  balanceBlob: {
    position: 'absolute', top: -60, right: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceIconBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  balanceTitle:  { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  balanceDate:   { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 2, marginBottom: 10 },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: '#FFFFFF' },
  balanceMeta:    { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  balanceMetaText:{ fontSize: 13, color: 'rgba(255,255,255,0.80)' },
  infoPill: {
    marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  infoPillText: { fontSize: 12, color: '#FFFFFF' },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: T.text, marginBottom: 10 },
});

// ─── Tab: Ganancias (combinado Ventas + Saldo) ────────────────────────────────

function GananciasTabC() {
  const T = useThemeColors();
  const vc = makeVcStyles(T);
  const sc = makeScStyles(T);
  const { fridayBalance, fridayDate, weeklySales } = useComercianteStore();
  const totalOrders = weeklySales.reduce((s, d) => s + d.orders, 0);
  const totalAmount = weeklySales.reduce((s, d) => s + d.amount, 0);
  const maxAmount   = Math.max(...weeklySales.map(d => d.amount));
  const fridayLabel = formatShortDate(fridayDate);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <FadeIn>

      {/* Saldo a cobrar */}
      <LinearGradient colors={[HEADER, HEADER2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sc.balanceCard}>
        <View style={sc.balanceBlob} pointerEvents="none" />
        <View style={sc.balanceIconBadge}>
          <Ionicons name="wallet-outline" size={22} color="#FFFFFF" />
        </View>
        <Text style={sc.balanceTitle}>Saldo a cobrar el viernes</Text>
        <Text style={sc.balanceDate}>{fridayLabel}</Text>
        <Text style={sc.balanceAmount}>${fridayBalance.toFixed(2)}</Text>
        <View style={sc.balanceMeta}>
          <Ionicons name="cube-outline" size={14} color="rgba(255,255,255,0.80)" />
          <Text style={sc.balanceMetaText}> {totalOrders} pedidos esta semana</Text>
        </View>
        <View style={sc.infoPill}>
          <Ionicons name="information-circle-outline" size={14} color="#FFFFFF" />
          <Text style={sc.infoPillText}> HiGo deposita todos los viernes antes de las 18:00</Text>
        </View>
      </LinearGradient>

      {/* Resumen semanal */}
      <View style={vc.summaryRow}>
        <View style={[vc.summaryCard, { backgroundColor: T.warningFaint }]}>
          <Text style={vc.summaryValue}>${totalAmount.toFixed(2)}</Text>
          <Text style={vc.summaryLabel}>Ventas semana</Text>
        </View>
        <View style={[vc.summaryCard, { backgroundColor: T.successFaint }]}>
          <Text style={[vc.summaryValue, { color: '#1B5E20' }]}>{totalOrders}</Text>
          <Text style={vc.summaryLabel}>Pedidos</Text>
        </View>
      </View>

      {/* Desglose diario */}
      <Text style={vc.sectionTitle}>Desglose diario</Text>
      {weeklySales.map((day, i) => {
        const barW  = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
        const isHoy = isToday(day.date);
        return (
          <View key={i} style={[vc.dayRow, isHoy && vc.dayRowToday]}>
            <View style={vc.dayLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[vc.dayName, isHoy && { color: HEADER }]}>{day.dayLabel}</Text>
                {isHoy && (
                  <View style={vc.todayChip}>
                    <Text style={vc.todayChipText}>HOY</Text>
                  </View>
                )}
              </View>
              <Text style={vc.dayDate}>{day.shortDate}</Text>
            </View>
            <View style={vc.barContainer}>
              <View style={[vc.barFill, { width: `${barW}%` as any, backgroundColor: isHoy ? HEADER : HEADER2 }]} />
            </View>
            <View style={vc.dayRight}>
              <Text style={vc.dayAmount}>${day.amount.toFixed(2)}</Text>
              <Text style={vc.dayOrders}>{day.orders} ped.</Text>
            </View>
          </View>
        );
      })}
      <View style={{ height: 32 }} />
      </FadeIn>
    </ScrollView>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function PerfilTabC({
  onLogout, merchantName, merchantStall,
}: {
  onLogout: () => void; merchantName: string; merchantStall: string;
}) {
  const T = useThemeColors();
  const pf = makePfStyles(T);
  const user = useAuthStore((s) => s.user);
  const updatePhoto = useAuthStore((s) => s.updatePhoto);
  const [showChangePhone, setShowChangePhone] = useState(false);
  // Se prioriza lo que el comerciante puso de verdad en su solicitud — el
  // texto fijo solo queda como respaldo si esos datos no llegaron a existir.
  const stallDisplay = user?.stallNumber
    ? `Puesto #${user?.stallNumber}${user?.giro ? ` · ${user.giro}` : ''}`
    : merchantStall;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <FadeIn style={{ gap: 14 }}>
      <View style={pf.profileCard}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => pickAvatarPhoto(updatePhoto)}>
          <View style={pf.avatarRing}>
            <Avatar name={user?.name ?? merchantName} photoUri={user?.photoUri} size={80} bg={T.primaryFaint} textColor={HEADER} />
            <View style={pf.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={pf.name} numberOfLines={1}>{user ? shortName(user) : merchantName}</Text>
        <View style={pf.rolePill}>
          <Ionicons name="storefront" size={12} color={HEADER} />
          <Text style={pf.roleText}> Comerciante</Text>
        </View>
      </View>

      <Text style={pf.sectionLabel}>Información</Text>
      <View style={pf.card}>
        <PerfilRowC icon="storefront-outline"       label="Puesto"    value={stallDisplay} />
        <View style={pf.divider} />
        <PerfilRowC
          icon="call-outline"
          label="Teléfono"
          value={user?.phone ?? '—'}
          onPress={() => setShowChangePhone(true)}
        />
        <View style={pf.divider} />
        <PerfilRowC icon="card-outline"             label="Cédula"    value={user?.cedula ?? '—'} />
        <View style={pf.divider} />
        <PerfilRowC icon="shield-checkmark-outline" label="Estado"    value="Verificado" valueColor={T.success} />
      </View>

      <Text style={pf.sectionLabel}>Apariencia</Text>
      <AppearanceSelector accentColor={HEADER} />

      <TouchableOpacity style={pf.logoutBtn} activeOpacity={0.85} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#E74C3C" />
        <Text style={pf.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
      <View style={{ height: 16 }} />
      </FadeIn>
      {showChangePhone && (
        <ChangePhoneModal currentPhone={user?.phone ?? ''} onClose={() => setShowChangePhone(false)} />
      )}
    </ScrollView>
  );
}

function PerfilRowC({
  icon, label, value, valueColor, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; valueColor?: string; onPress?: () => void;
}) {
  const T = useThemeColors();
  const pf = makePfStyles(T);
  const content = (
    <>
      <View style={pf.rowIcon}>
        <Ionicons name={icon} size={18} color={HEADER} />
      </View>
      <Text style={pf.rowLabel}>{label}</Text>
      <Text style={[pf.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={T.textFaint} style={{ marginLeft: 4 }} />}
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={pf.row} activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={pf.row}>{content}</View>;
}

// ─── Modal: cambiar teléfono ────────────────────────────────────────────────
// Sin verificación por SMS todavía (requeriría activar Firebase Phone Auth,
// con costo por mensaje) — se protege pidiendo la contraseña actual, mismo
// resguardo que ya se usa para cambiar correo/contraseña.

function ChangePhoneModal({ currentPhone, onClose }: { currentPhone: string; onClose: () => void }) {
  const T = useThemeColors();
  const pf = makePfStyles(T);
  const changePhone = useAuthStore((s) => s.changePhone);
  const [newPhone, setNewPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = newPhone.trim();
    if (!trimmed || !password) {
      Alert.alert('Faltan datos', 'Ingresa el nuevo teléfono y tu contraseña actual.');
      return;
    }
    if (trimmed === currentPhone) {
      Alert.alert('Teléfono igual', 'Ese ya es tu teléfono actual.');
      return;
    }
    setSaving(true);
    try {
      await changePhone(trimmed, password);
      Alert.alert('Teléfono actualizado', 'Tu número de contacto se actualizó correctamente.');
      onClose();
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const message =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'La contraseña actual no es correcta.'
          : 'No se pudo actualizar el teléfono. Intenta de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={pf.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={pf.modalCard}>
          <View style={pf.modalHeader}>
            <Text style={pf.modalTitle}>Cambiar teléfono</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={T.textFaint} />
            </TouchableOpacity>
          </View>

          <Text style={pf.modalHelper}>Teléfono actual: {currentPhone || '—'}</Text>

          <Text style={pf.modalLabel}>Nuevo teléfono</Text>
          <TextInput
            style={pf.modalInput}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="09XXXXXXXX"
            placeholderTextColor={T.textFaint}
            keyboardType="phone-pad"
          />

          <Text style={pf.modalLabel}>Contraseña actual</Text>
          <View style={pf.modalPasswordWrapper}>
            <TextInput
              style={pf.modalPasswordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña actual"
              placeholderTextColor={T.textFaint}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={pf.modalEyeBtn} activeOpacity={0.7} onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={T.textFaint} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[pf.modalSaveBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={pf.modalSaveBtnText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makePfStyles = (T: ThemeColors) => StyleSheet.create({
  profileCard: {
    alignItems: 'center', gap: 8, paddingVertical: 22,
    backgroundColor: T.surface, borderRadius: 20,
    ...cardShadow(T, HEADER),
  },
  avatarRing: {
    position: 'relative', padding: 4, borderRadius: 46,
    borderWidth: 2, borderColor: T.primaryFaint,
  },
  avatarEditBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: HEADER, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.surface,
  },
  name:      { fontSize: 20, fontWeight: '800', color: T.text, marginTop: 4 },
  rolePill:  { flexDirection: 'row', alignItems: 'center', backgroundColor: T.primaryFaint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: T.border },
  roleText:  { fontSize: 13, fontWeight: '700', color: HEADER },
  card:      { backgroundColor: T.surface, borderRadius: 16, paddingHorizontal: 4, borderWidth: 1.5, borderColor: T.border, overflow: 'hidden' },
  divider:   { height: 1, backgroundColor: T.border },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: T.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  rowLabel:  { flex: 1, fontSize: 14, color: T.textFaint },
  rowValue:  { fontSize: 14, fontWeight: '700', color: T.text },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 2 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: T.dangerFaint, borderRadius: 14, paddingVertical: 14, backgroundColor: T.dangerFaint, marginTop: 4 },
  logoutText:{ fontSize: 15, fontWeight: '700', color: '#E74C3C' },

  // Modal: cambiar teléfono
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,30,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  modalHelper: { fontSize: 13, color: T.textSoft, marginBottom: 4 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: T.textSoft, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.4 },
  modalInput: {
    backgroundColor: T.background, borderRadius: 10, borderWidth: 1.5, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: T.text,
  },
  modalPasswordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.background, borderRadius: 10, borderWidth: 1.5, borderColor: T.border,
    paddingHorizontal: 14,
  },
  modalPasswordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: T.text },
  modalEyeBtn: { paddingLeft: 10, paddingVertical: 6 },
  modalSaveBtn: { marginTop: 24, backgroundColor: HEADER, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  modalSaveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

function TabBarItem({
  icon, label, active, badge = 0, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; active: boolean; badge?: number; onPress: () => void;
}) {
  const T = useThemeColors();
  const tb = makeTbStyles(T);
  const activeIcon = icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap;
  return (
    <TouchableOpacity style={tb.item} activeOpacity={0.7} onPress={onPress}>
      <View style={tb.iconWrapper}>
        <Ionicons name={active ? activeIcon : icon} size={24} color={active ? HEADER : T.textFaint} />
        {badge > 0 && (
          <View style={tb.badge}>
            <Text style={tb.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tb.label, active && { color: HEADER }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeTbStyles = (T: ThemeColors) => StyleSheet.create({
  item:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  iconWrapper: { position: 'relative' },
  badge:       { position: 'absolute', top: -4, right: -8, backgroundColor: '#E74C3C', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:   { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  label:       { fontSize: 11, fontWeight: '600', color: T.textFaint },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ComercianteDashboardScreen({ navigation }: Props) {
  const T = useThemeColors();
  const styles = makeStyles(T);
  const [activeTab, setActiveTab]     = useState<Tab>('pedidos');
  const user = useAuthStore((s) => s.user);
  const { dispatchTickets, disponible, toggleDisponible } = useComercianteStore();
  const pendienteCount = dispatchTickets.filter(t => t.status === 'pendiente').length;
  const merchantName  = user?.name ?? 'Comerciante';
  const merchantStall = user?.stallNumber ? `Puesto #${user.stallNumber}` : 'Puesto sin asignar';

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => {
        useAuthStore.getState().logout();
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      }},
    ]);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <StaffHeader
        name={user ? shortName(user) : merchantName}
        photoUri={user?.photoUri}
        roleLabel={user?.stallNumber ? `Comerciante · Puesto ${user.stallNumber}` : 'Comerciante'}
        available={disponible}
        onToggleAvailable={toggleDisponible}
      >

        {/* Tarjeta flotante de pedidos pendientes, superpuesta al borde del header */}
        {pendienteCount > 0 && activeTab === 'pedidos' && (
          <View style={styles.floatingAlert}>
            <View style={styles.floatingAlertIcon}>
              <Ionicons name="cube-outline" size={16} color={HEADER} />
            </View>
            <Text style={styles.floatingAlertText}>
              {pendienteCount} pedido{pendienteCount > 1 ? 's' : ''} por preparar
            </Text>
            <Ionicons name="chevron-forward" size={16} color={T.textFaint} />
          </View>
        )}
      </StaffHeader>

      {/* ── Contenido ── */}
      <View style={styles.body}>
        {activeTab === 'pedidos'   && <DespachosTab />}
        {activeTab === 'ganancias' && <GananciasTabC />}
        {activeTab === 'perfil'    && (
          <PerfilTabC
            onLogout={handleLogout}
            merchantName={merchantName}
            merchantStall={merchantStall}
          />
        )}
      </View>

      {/* ── Bottom tab bar ── */}
      <View style={styles.tabBar}>
        <TabBarItem
          icon="cube-outline"
          label="Pedidos"
          active={activeTab === 'pedidos'}
          badge={pendienteCount}
          onPress={() => setActiveTab('pedidos')}
        />
        <TabBarItem
          icon="cash-outline"
          label="Ganancias"
          active={activeTab === 'ganancias'}
          onPress={() => setActiveTab('ganancias')}
        />
        <TabBarItem
          icon="person-outline"
          label="Perfil"
          active={activeTab === 'perfil'}
          onPress={() => setActiveTab('perfil')}
        />
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },

  floatingAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginTop: 16,
  },
  floatingAlertIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.primaryFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  floatingAlertText: { flex: 1, fontSize: 13, fontWeight: '700', color: T.text },

  body:   { flex: 1, backgroundColor: T.background },
  tabBar: { flexDirection: 'row', backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, paddingBottom: 4, paddingTop: 6 },
});

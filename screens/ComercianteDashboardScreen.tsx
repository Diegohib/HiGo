import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useComercianteStore, DispatchTicket, DaySale } from '../store/comercianteStore';
import { useAuthStore } from '../store/authStore';
import { formatShortDate } from '../utils/earnings';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ComercianteDashboard'>;
};

type Tab = 'pedidos' | 'ganancias' | 'perfil';

const HEADER   = '#A0390E';
const HEADER2  = '#C4623A';
const BG       = '#FDF6F3';

// ─── Tab: Despachos ───────────────────────────────────────────────────────────

function TicketCard({ ticket, onConfirm }: { ticket: DispatchTicket; onConfirm: () => void }) {
  const isRetirado = ticket.status === 'retirado';
  const hora = ticket.scheduledAt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[tc.card, isRetirado && tc.cardDone]}>
      {/* Header ticket */}
      <View style={tc.cardTop}>
        <View style={tc.cocheroRow}>
          <View style={tc.cocheroIconBox}>
            <Ionicons name="bicycle-outline" size={22} color={HEADER} />
          </View>
          <View>
            <Text style={tc.cocheroName}>{ticket.cocheroName}</Text>
            <Text style={tc.cocheroLabel}>Cochero asignado · retira a las {hora}</Text>
          </View>
        </View>
        <View style={[tc.statusBadge, isRetirado ? tc.badgeDone : tc.badgePending]}>
          <Text style={tc.statusBadgeText}>{isRetirado ? 'Retirado ✓' : 'Pendiente'}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={tc.divider} />
      <Text style={tc.orderIdLabel}>Pedido {ticket.orderId}</Text>
      {ticket.items.map((item, i) => (
        <View key={i} style={tc.itemRow}>
          <Text style={tc.itemDot}>·</Text>
          <Text style={tc.itemText}>
            {item.productName} — <Text style={tc.itemQty}>{item.qty} {item.unit}</Text>
          </Text>
        </View>
      ))}

      {/* Footer */}
      <View style={tc.divider} />
      <View style={tc.cardBottom}>
        <Text style={tc.subtotalText}>Subtotal: <Text style={tc.subtotalAmount}>${ticket.subtotal.toFixed(2)}</Text></Text>
        {!isRetirado && (
          <TouchableOpacity style={tc.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={tc.confirmBtnText}>Confirmar retiro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function DespachosTab() {
  const { dispatchTickets, markRetirado } = useComercianteStore();

  const pendientes = dispatchTickets.filter(t => t.status === 'pendiente');
  const retirados  = dispatchTickets.filter(t => t.status === 'retirado');

  function handleConfirm(ticket: DispatchTicket) {
    Alert.alert(
      'Confirmar retiro',
      `¿El cochero ${ticket.cocheroName} ya retiró los productos del pedido ${ticket.orderId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, retirado', onPress: () => markRetirado(ticket.id) },
      ],
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={tc.scroll} showsVerticalScrollIndicator={false}>
      {pendientes.length > 0 && (
        <>
          <Text style={tc.groupLabel}>Por despachar ({pendientes.length})</Text>
          {pendientes.map(t => (
            <TicketCard key={t.id} ticket={t} onConfirm={() => handleConfirm(t)} />
          ))}
        </>
      )}
      {retirados.length > 0 && (
        <>
          <Text style={[tc.groupLabel, { color: '#888', marginTop: 16 }]}>Retirados hoy ({retirados.length})</Text>
          {retirados.map(t => (
            <TicketCard key={t.id} ticket={t} onConfirm={() => {}} />
          ))}
        </>
      )}
      {pendientes.length === 0 && retirados.length === 0 && (
        <View style={tc.emptyBox}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
          <Text style={tc.emptyText}>Sin despachos pendientes hoy</Text>
        </View>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const tc = StyleSheet.create({
  scroll:    { padding: 16 },
  groupLabel:{ fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardDone:  { opacity: 0.65 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cocheroRow:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cocheroIconBox:{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDF0EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cocheroName:   { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  cocheroLabel:{ fontSize: 11, color: '#888', marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgePending:{ backgroundColor: '#FFF3CD' },
  badgeDone:   { backgroundColor: '#D4EDDA' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#333' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  orderIdLabel:{ fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  itemDot: { fontSize: 18, color: HEADER2, marginRight: 6, lineHeight: 20 },
  itemText:{ fontSize: 14, color: '#444', flex: 1 },
  itemQty: { fontWeight: '700', color: '#1A1A1A' },
  cardBottom:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtotalText:  { fontSize: 13, color: '#555' },
  subtotalAmount:{ fontWeight: '800', color: '#1A1A1A', fontSize: 15 },
  confirmBtn: {
    backgroundColor: HEADER, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyBox:  { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 12 },
});

// ─── Tab: Ventas ──────────────────────────────────────────────────────────────

function VentasTab() {
  const { weeklySales } = useComercianteStore();
  const totalOrders = weeklySales.reduce((s, d) => s + d.orders, 0);
  const totalAmount = weeklySales.reduce((s, d) => s + d.amount, 0);
  const maxAmount   = Math.max(...weeklySales.map(d => d.amount));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={vc.scroll} showsVerticalScrollIndicator={false}>
      {/* Resumen semanal */}
      <View style={vc.summaryRow}>
        <View style={[vc.summaryCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={vc.summaryValue}>${totalAmount.toFixed(2)}</Text>
          <Text style={vc.summaryLabel}>Ventas semana</Text>
        </View>
        <View style={[vc.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[vc.summaryValue, { color: '#1B5E20' }]}>{totalOrders}</Text>
          <Text style={vc.summaryLabel}>Pedidos</Text>
        </View>
      </View>

      <Text style={vc.sectionTitle}>Desglose diario</Text>

      {weeklySales.map((day, i) => {
        const barWidth = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
        const isToday  = i === weeklySales.length - 1;
        return (
          <View key={i} style={vc.dayRow}>
            <View style={vc.dayLeft}>
              <Text style={[vc.dayName, isToday && { color: HEADER }]}>{day.dayLabel}</Text>
              <Text style={vc.dayDate}>{day.shortDate}</Text>
            </View>
            <View style={vc.barContainer}>
              <View style={[vc.barFill, { width: `${barWidth}%`, backgroundColor: isToday ? HEADER : HEADER2 }]} />
            </View>
            <View style={vc.dayRight}>
              <Text style={vc.dayAmount}>${day.amount.toFixed(2)}</Text>
              <Text style={vc.dayOrders}>{day.orders} ped.</Text>
            </View>
          </View>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const vc = StyleSheet.create({
  scroll: { padding: 16 },
  summaryRow:  { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  summaryValue:{ fontSize: 22, fontWeight: '900', color: '#C4623A' },
  summaryLabel:{ fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle:{ fontSize: 14, fontWeight: '800', color: '#333', marginBottom: 12 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  dayLeft:    { width: 80 },
  dayName:    { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  dayDate:    { fontSize: 11, color: '#888', marginTop: 1 },
  barContainer:{ flex: 1, height: 8, backgroundColor: '#F0EBE8', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 4 },
  dayRight:   { width: 72, alignItems: 'flex-end' },
  dayAmount:  { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  dayOrders:  { fontSize: 11, color: '#888', marginTop: 1 },
});

// ─── Tab: Saldo ───────────────────────────────────────────────────────────────

function SaldoTab() {
  const { fridayBalance, fridayDate, weeklySales } = useComercianteStore();
  const fridayLabel = formatShortDate(fridayDate);
  const totalOrders = weeklySales.reduce((s, d) => s + d.orders, 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={sc.scroll} showsVerticalScrollIndicator={false}>

      {/* Tarjeta principal de saldo */}
      <View style={sc.balanceCard}>
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
      </View>

      {/* Desglose por día */}
      <Text style={sc.sectionTitle}>Ventas de la semana</Text>
      {weeklySales.map((day, i) => (
        <View key={i} style={sc.dayCard}>
          <View style={sc.dayCardLeft}>
            <Text style={sc.dayCardDay}>{day.dayLabel}</Text>
            <Text style={sc.dayCardDate}>{day.shortDate}</Text>
          </View>
          <View style={sc.dayCardRight}>
            <Text style={sc.dayCardAmount}>${day.amount.toFixed(2)}</Text>
            <Text style={sc.dayCardOrders}>{day.orders} pedidos</Text>
          </View>
        </View>
      ))}

      {/* Total */}
      <View style={sc.totalCard}>
        <Text style={sc.totalLabel}>Total semana</Text>
        <Text style={sc.totalAmount}>${fridayBalance.toFixed(2)}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const sc = StyleSheet.create({
  scroll: { padding: 16 },
  balanceCard: {
    backgroundColor: HEADER, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 5,
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
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: '#333', marginBottom: 10 },
  dayCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  dayCardLeft:   {},
  dayCardDay:    { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  dayCardDate:   { fontSize: 11, color: '#888', marginTop: 1 },
  dayCardRight:  { alignItems: 'flex-end' },
  dayCardAmount: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  dayCardOrders: { fontSize: 11, color: '#888', marginTop: 1 },
  totalCard: {
    backgroundColor: '#FFF3E0', borderRadius: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, marginTop: 8,
  },
  totalLabel:  { fontSize: 15, fontWeight: '700', color: '#333' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: HEADER },
});

// ─── Tab: Ganancias (combinado Ventas + Saldo) ────────────────────────────────

function GananciasTabC() {
  const { fridayBalance, fridayDate, weeklySales } = useComercianteStore();
  const totalOrders = weeklySales.reduce((s, d) => s + d.orders, 0);
  const totalAmount = weeklySales.reduce((s, d) => s + d.amount, 0);
  const maxAmount   = Math.max(...weeklySales.map(d => d.amount));
  const fridayLabel = formatShortDate(fridayDate);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>

      {/* Saldo a cobrar */}
      <View style={sc.balanceCard}>
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
      </View>

      {/* Resumen semanal */}
      <View style={vc.summaryRow}>
        <View style={[vc.summaryCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={vc.summaryValue}>${totalAmount.toFixed(2)}</Text>
          <Text style={vc.summaryLabel}>Ventas semana</Text>
        </View>
        <View style={[vc.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[vc.summaryValue, { color: '#1B5E20' }]}>{totalOrders}</Text>
          <Text style={vc.summaryLabel}>Pedidos</Text>
        </View>
      </View>

      {/* Desglose diario */}
      <Text style={vc.sectionTitle}>Desglose diario</Text>
      {weeklySales.map((day, i) => {
        const barW  = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
        const isHoy = i === weeklySales.length - 1;
        return (
          <View key={i} style={vc.dayRow}>
            <View style={vc.dayLeft}>
              <Text style={[vc.dayName, isHoy && { color: HEADER }]}>{day.dayLabel}</Text>
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
    </ScrollView>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function PerfilTabC({
  onLogout, merchantName, merchantStall,
}: {
  onLogout: () => void; merchantName: string; merchantStall: string;
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <View style={pf.wrapper}>
        <View style={pf.avatar}>
          <Ionicons name="storefront-outline" size={38} color={HEADER} />
        </View>
        <Text style={pf.name}>{merchantName}</Text>
        <View style={pf.rolePill}>
          <Text style={pf.roleText}>Comerciante</Text>
        </View>
      </View>

      <View style={pf.card}>
        <PerfilRowC icon="storefront-outline"       label="Puesto"    value={merchantStall} />
        <View style={pf.divider} />
        <PerfilRowC icon="call-outline"             label="Teléfono"  value="+593 99 000 0000" />
        <View style={pf.divider} />
        <PerfilRowC icon="card-outline"             label="Cédula"    value="17XXXXXXXX" />
        <View style={pf.divider} />
        <PerfilRowC icon="shield-checkmark-outline" label="Estado"    value="Verificado" valueColor="#27AE60" />
      </View>

      <TouchableOpacity style={pf.logoutBtn} activeOpacity={0.85} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#E74C3C" />
        <Text style={pf.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function PerfilRowC({
  icon, label, value, valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={pf.row}>
      <View style={pf.rowIcon}>
        <Ionicons name={icon} size={18} color={HEADER} />
      </View>
      <Text style={pf.rowLabel}>{label}</Text>
      <Text style={[pf.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const pf = StyleSheet.create({
  wrapper:   { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatar:    { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FDF0EB', borderWidth: 3, borderColor: '#F0C0A0', alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  rolePill:  { backgroundColor: '#FDF0EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: '#F0C0A0' },
  roleText:  { fontSize: 13, fontWeight: '700', color: HEADER },
  card:      { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#F0C0A0', overflow: 'hidden' },
  divider:   { height: 1, backgroundColor: '#F0F0F0' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FDF0EB', alignItems: 'center', justifyContent: 'center' },
  rowLabel:  { flex: 1, fontSize: 14, color: '#888' },
  rowValue:  { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#FADADD', borderRadius: 14, paddingVertical: 14, backgroundColor: '#FFF5F5', marginTop: 4 },
  logoutText:{ fontSize: 15, fontWeight: '700', color: '#E74C3C' },
});

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

function TabBarItem({
  icon, label, active, badge = 0, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; active: boolean; badge?: number; onPress: () => void;
}) {
  const activeIcon = icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap;
  return (
    <TouchableOpacity style={tb.item} activeOpacity={0.7} onPress={onPress}>
      <View style={tb.iconWrapper}>
        <Ionicons name={active ? activeIcon : icon} size={24} color={active ? HEADER : '#9B9B9B'} />
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

const tb = StyleSheet.create({
  item:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  iconWrapper: { position: 'relative' },
  badge:       { position: 'absolute', top: -4, right: -8, backgroundColor: '#E74C3C', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:   { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  label:       { fontSize: 11, fontWeight: '600', color: '#9B9B9B' },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ComercianteDashboardScreen({ navigation }: Props) {
  const [activeTab, setActiveTab]     = useState<Tab>('pedidos');
  const [disponible, setDisponible]   = useState(true);
  const { merchantName, merchantStall, dispatchTickets } = useComercianteStore();
  const pendienteCount = dispatchTickets.filter(t => t.status === 'pendiente').length;

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="storefront-outline" size={22} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerName}>{merchantName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.disponibleBadge, !disponible && styles.noDisponibleBadge]}
          activeOpacity={0.8}
          onPress={() => setDisponible(!disponible)}
        >
          <View style={[styles.disponibleDot, !disponible && styles.noDisponibleDot]} />
          <Text style={[styles.disponibleText, !disponible && styles.noDisponibleText]}>
            {disponible ? 'Disponible' : 'No disponible'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert banner de pedidos pendientes */}
      {pendienteCount > 0 && activeTab === 'pedidos' && (
        <View style={styles.alertBanner}>
          <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
          <Text style={styles.alertBannerText}>
            {' '}{pendienteCount} despacho{pendienteCount > 1 ? 's' : ''} pendiente{pendienteCount > 1 ? 's' : ''} hoy
          </Text>
        </View>
      )}

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: HEADER,
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:   { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerName:     { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  disponibleBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(46,204,113,0.2)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  noDisponibleBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' },
  disponibleDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  noDisponibleDot:   { backgroundColor: 'rgba(255,255,255,0.5)' },
  disponibleText:    { fontSize: 13, fontWeight: '700', color: '#2ECC71' },
  noDisponibleText:  { color: 'rgba(255,255,255,0.6)' },

  alertBanner:     { backgroundColor: HEADER2, paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  alertBannerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  body:   { flex: 1, backgroundColor: BG },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EBE8', paddingBottom: 4, paddingTop: 6 },
});

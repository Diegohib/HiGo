import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Pressable, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAdminPayStore, Operator } from '../store/adminPayStore';
import { useAdminFinanzasStore } from '../store/adminFinanzasStore';
import { useAuthStore } from '../store/authStore';
import { formatShortDate, nextPayFriday } from '../utils/earnings';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

type Tab    = 'pagos' | 'finanzas' | 'perfil';
type Filter = 'todos' | 'cocheros' | 'transportistas';

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  header:       '#3D1F8B',
  headerDark:   '#2D1570',
  purple:       '#3D1F8B',
  purpleFaint:  '#EDE9F8',
  purpleBorder: '#C9BEED',
  green:        '#2ECC71',
  greenDark:    '#27AE60',
  greenFaint:   '#EAFAF1',
  bg:           '#F4F1FB',
  white:        '#FFFFFF',
  text:         '#1A1A1A',
  textSoft:     '#888',
};

const ROLE_LABEL: Record<string, string> = {
  cochero: 'Cochero', transportista: 'Transportista',
};
const ROLE_COLOR: Record<string, string> = {
  cochero: '#1A5C2A', transportista: '#5C3D08',
};

// ─── Tab: Pagos ───────────────────────────────────────────────────────────────

function PagosTab() {
  const { operators, paymentHistory, markAsPaid } = useAdminPayStore();
  const [filter,  setFilter]  = useState<Filter>('todos');
  const [confirm, setConfirm] = useState<Operator | null>(null);

  const pending      = operators.filter(o => !o.isPaid);
  const paid         = operators.filter(o =>  o.isPaid);
  const totalPending = pending.reduce((s, o) => s + o.weekEarnings, 0);
  const totalPaid    = paid.reduce((s, o)    => s + o.paidAmount,   0);
  const fridayLabel  = formatShortDate(nextPayFriday());

  const visible = operators.filter(o => {
    if (filter === 'cocheros')       return o.role === 'cochero';
    if (filter === 'transportistas') return o.role === 'transportista';
    return true;
  });

  function handleConfirmPay() {
    if (!confirm) return;
    markAsPaid(confirm.id);
    setConfirm(null);
  }

  return (
    <>
      <ScrollView contentContainerStyle={p.scroll} showsVerticalScrollIndicator={false}>

        {/* Próximo pago */}
        <View style={p.nextPayRow}>
          <Ionicons name="calendar-outline" size={14} color={C.purple} />
          <Text style={p.nextPayText}>Próximo pago viernes: {fridayLabel}</Text>
        </View>

        {/* Summary */}
        <View style={p.summaryRow}>
          <View style={[p.summaryCard, { backgroundColor: '#FFF3CD' }]}>
            <Text style={p.summaryLabel}>Por pagar</Text>
            <Text style={[p.summaryAmount, { color: '#E67E22' }]}>${totalPending.toFixed(2)}</Text>
            <Text style={p.summaryCount}>{pending.length} operador{pending.length !== 1 ? 'es' : ''}</Text>
          </View>
          <View style={[p.summaryCard, { backgroundColor: '#D4EDDA' }]}>
            <Text style={p.summaryLabel}>Pagado hoy</Text>
            <Text style={[p.summaryAmount, { color: '#1A5C2A' }]}>${totalPaid.toFixed(2)}</Text>
            <Text style={p.summaryCount}>{paid.length} operador{paid.length !== 1 ? 'es' : ''}</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={p.tabs}>
          {(['todos', 'cocheros', 'transportistas'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[p.tab, filter === f && p.tabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[p.tabText, filter === f && p.tabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Operator cards */}
        {visible.map(op => (
          <View key={op.id} style={[p.opCard, op.isPaid && p.opCardPaid]}>
            <View style={p.opLeft}>
              <View style={[p.roleBadge, { backgroundColor: ROLE_COLOR[op.role] }]}>
                <Text style={p.roleBadgeText}>{ROLE_LABEL[op.role]}</Text>
              </View>
              <Text style={p.opName}>{op.name}</Text>
              <Text style={p.opMeta}>
                {op.role === 'cochero'
                  ? `${op.ordersCount} pedidos`
                  : `${op.ordersCount} entregas · ${op.kmThisWeek.toFixed(1)} km`}
              </Text>
            </View>
            <View style={p.opRight}>
              {op.isPaid ? (
                <>
                  <Text style={p.paidAmount}>${op.paidAmount.toFixed(2)}</Text>
                  <View style={p.paidBadge}>
                    <Text style={p.paidBadgeText}>Pagado ✓</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={p.pendingAmount}>${op.weekEarnings.toFixed(2)}</Text>
                  <TouchableOpacity style={p.payBtn} activeOpacity={0.8} onPress={() => setConfirm(op)}>
                    <Text style={p.payBtnText}>Marcar pagado</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {/* History */}
        <View style={p.historySection}>
          <Text style={p.historyTitle}>Historial de pagos</Text>
          {paymentHistory.map(rec => (
            <View key={rec.id} style={p.historyRow}>
              <View style={p.historyLeft}>
                <View style={[p.historyDot, { backgroundColor: ROLE_COLOR[rec.role] }]} />
                <View>
                  <Text style={p.historyName}>{rec.operatorName}</Text>
                  <Text style={p.historyMeta}>{ROLE_LABEL[rec.role]} · {rec.weekLabel}</Text>
                </View>
              </View>
              <View style={p.historyRight}>
                <Text style={p.historyAmount}>${rec.amount.toFixed(2)}</Text>
                <Text style={p.historyDate}>{formatShortDate(rec.paidAt)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Confirm modal */}
      <Modal
        visible={confirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(null)}
      >
        <Pressable style={p.overlay} onPress={() => setConfirm(null)}>
          <Pressable style={p.modal} onPress={() => {}}>
            <Text style={p.modalTitle}>Confirmar pago</Text>
            {confirm && (
              <>
                <Text style={p.modalBody}>
                  Vas a registrar el pago de{'\n'}
                  <Text style={p.modalName}>{confirm.name}</Text>
                  {'\n'}por la semana actual.
                </Text>
                <View style={p.modalAmountRow}>
                  <Text style={p.modalAmountLabel}>Monto a pagar</Text>
                  <Text style={p.modalAmount}>${confirm.weekEarnings.toFixed(2)}</Text>
                </View>
              </>
            )}
            <View style={p.modalBtns}>
              <TouchableOpacity style={[p.modalBtn, p.modalBtnCancel]} onPress={() => setConfirm(null)} activeOpacity={0.8}>
                <Text style={p.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[p.modalBtn, p.modalBtnConfirm]} onPress={handleConfirmPay} activeOpacity={0.8}>
                <Text style={p.modalBtnConfirmText}>Confirmar pago</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const p = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 24 },

  nextPayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.purpleFaint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  nextPayText:{ fontSize: 13, fontWeight: '600', color: C.purple },

  summaryRow:   { flexDirection: 'row', gap: 12 },
  summaryCard:  { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', gap: 2 },
  summaryLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  summaryAmount:{ fontSize: 26, fontWeight: '800' },
  summaryCount: { fontSize: 12, color: '#777' },

  tabs:        { flexDirection: 'row', backgroundColor: C.purpleFaint, borderRadius: 12, padding: 4, gap: 2 },
  tab:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive:   { backgroundColor: C.purple },
  tabText:     { fontSize: 13, fontWeight: '600', color: C.purple },
  tabTextActive:{ color: C.white },

  opCard:    { backgroundColor: C.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  opCardPaid:{ opacity: 0.7 },
  opLeft:    { flex: 1, gap: 4 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 2 },
  roleBadgeText: { color: C.white, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  opName:    { fontSize: 16, fontWeight: '700', color: C.text },
  opMeta:    { fontSize: 12, color: '#777' },
  opRight:   { alignItems: 'flex-end', gap: 6, marginLeft: 12 },

  pendingAmount: { fontSize: 22, fontWeight: '800', color: '#E67E22' },
  payBtn:        { backgroundColor: C.purple, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  payBtnText:    { color: C.white, fontSize: 13, fontWeight: '700' },
  paidAmount:    { fontSize: 22, fontWeight: '800', color: '#2ECC71' },
  paidBadge:     { backgroundColor: '#D4EDDA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  paidBadgeText: { color: '#1A5C2A', fontSize: 12, fontWeight: '700' },

  historySection:{ backgroundColor: C.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, marginTop: 4 },
  historyTitle:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  historyRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0EDF9' },
  historyLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  historyDot:    { width: 10, height: 10, borderRadius: 5 },
  historyName:   { fontSize: 14, fontWeight: '600', color: C.text },
  historyMeta:   { fontSize: 11, color: '#999', marginTop: 1 },
  historyRight:  { alignItems: 'flex-end', gap: 1 },
  historyAmount: { fontSize: 15, fontWeight: '700', color: C.purple },
  historyDate:   { fontSize: 11, color: '#999' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal:   { backgroundColor: C.white, borderRadius: 20, padding: 24, width: '100%', gap: 16 },
  modalTitle:       { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
  modalBody:        { fontSize: 15, color: '#444', textAlign: 'center', lineHeight: 22 },
  modalName:        { fontWeight: '700', color: C.purple },
  modalAmountRow:   { backgroundColor: C.purpleFaint, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  modalAmountLabel: { fontSize: 12, color: '#777', fontWeight: '500' },
  modalAmount:      { fontSize: 32, fontWeight: '800', color: C.purple },
  modalBtns:        { flexDirection: 'row', gap: 10 },
  modalBtn:         { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancel:        { backgroundColor: C.purpleFaint },
  modalBtnCancelText:    { color: C.purple, fontSize: 15, fontWeight: '600' },
  modalBtnConfirm:       { backgroundColor: C.purple },
  modalBtnConfirmText:   { color: C.white, fontSize: 15, fontWeight: '700' },
});

// ─── Tab: Finanzas ────────────────────────────────────────────────────────────

function FinanzasTab({
  navigation,
}: {
  navigation: StackNavigationProp<RootStackParamList, 'AdminDashboard'>;
}) {
  const { weeks } = useAdminFinanzasStore();
  const current      = weeks[0];
  const totalPayouts = current.toComerciantes + current.toCocheros + current.toTransportistas;
  const fridayLabel  = formatShortDate(nextPayFriday());

  return (
    <ScrollView contentContainerStyle={fi.scroll} showsVerticalScrollIndicator={false}>

      {/* Chips resumen */}
      <View style={fi.chipsRow}>
        <FinChip label="Ingresos"  value={`$${current.totalIncome.toFixed(0)}`} bg="#E3F2FD" color="#0D47A1" />
        <FinChip label="A pagar"   value={`$${totalPayouts.toFixed(0)}`}        bg="#FFF3E0" color="#E65100" />
        <FinChip label="Neto HiGo" value={`$${current.higoNet.toFixed(0)}`}     bg="#E8F5E9" color="#1B5E20" />
      </View>

      {/* Semana actual */}
      <View style={fi.card}>
        <View style={fi.cardHeader}>
          <Text style={fi.cardTitle}>{current.weekLabel}</Text>
          <View style={fi.pendingPill}>
            <Text style={fi.pendingPillText}>Pendiente</Text>
          </View>
        </View>
        <Text style={fi.cardSub}>{current.ordersCount} pedidos procesados</Text>

        <View style={fi.divider} />
        <Text style={fi.subSection}>Egresos a operadores</Text>
        <FinRow icon="cube-outline"     label="Comerciantes"      amount={current.toComerciantes}   color="#E65100" />
        <FinRow icon="bicycle-outline"  label="Cocheros"          amount={current.toCocheros}       color="#1A5C2A" />
        <FinRow icon="car-outline"      label="Transportistas"    amount={current.toTransportistas}  color="#5C3D08" />

        <View style={fi.divider} />
        <Text style={fi.subSection}>Resultado HiGo</Text>
        <FinRow icon="briefcase-outline" label="Margen gestión (7%)" amount={current.higoGross}         color={C.purple} />
        <FinRow icon="settings-outline"  label="Costos operativos"   amount={-current.operationalCosts} color="#C62828" />

        <View style={[fi.divider, { marginTop: 6 }]} />
        <View style={fi.netRow}>
          <Text style={fi.netLabel}>Ganancia neta</Text>
          <Text style={[fi.netAmount, { color: current.higoNet >= 0 ? '#1B5E20' : '#B71C1C' }]}>
            ${current.higoNet.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Navegación */}
      <TouchableOpacity style={fi.navBtn} activeOpacity={0.8} onPress={() => navigation.navigate('AdminFinanzas')}>
        <Ionicons name="bar-chart-outline" size={18} color={C.purple} />
        <Text style={fi.navBtnText}>Ver historial de 8 semanas</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={C.purple} />
      </TouchableOpacity>

      <TouchableOpacity style={fi.navBtn} activeOpacity={0.8} onPress={() => navigation.navigate('AdminSolicitudes')}>
        <Ionicons name="document-text-outline" size={18} color={C.purple} />
        <Text style={fi.navBtnText}>Ver solicitudes operativas</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={C.purple} />
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function FinChip({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <View style={[fi.chip, { backgroundColor: bg }]}>
      <Text style={[fi.chipValue, { color }]}>{value}</Text>
      <Text style={[fi.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

function FinRow({ icon, label, amount, color }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; amount: number; color: string;
}) {
  const isNeg = amount < 0;
  return (
    <View style={fi.row}>
      <View style={fi.rowLeft}>
        <Ionicons name={icon} size={14} color="#555" />
        <Text style={fi.rowLabel}>{label}</Text>
      </View>
      <Text style={[fi.rowAmount, { color }]}>{isNeg ? '-' : ''}${Math.abs(amount).toFixed(2)}</Text>
    </View>
  );
}

const fi = StyleSheet.create({
  scroll:    { padding: 16, gap: 12, paddingBottom: 24 },
  chipsRow:  { flexDirection: 'row', gap: 8 },
  chip:      { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  chipValue: { fontSize: 16, fontWeight: '800' },
  chipLabel: { fontSize: 11, marginTop: 2, opacity: 0.8 },

  card:       { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  pendingPill:{ backgroundColor: '#FFF3CD', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pendingPillText: { fontSize: 11, fontWeight: '700', color: '#8B5E00' },
  cardSub:    { fontSize: 12, color: '#888', marginTop: 2 },
  divider:    { height: 1, backgroundColor: '#EFEFEF', marginVertical: 10 },
  subSection: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  rowLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rowLabel:  { fontSize: 14, color: '#333' },
  rowAmount: { fontSize: 14, fontWeight: '700' },

  netRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:  { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  netAmount: { fontSize: 18, fontWeight: '800' },

  navBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  navBtnText:{ flex: 1, fontSize: 15, fontWeight: '600', color: C.purple, marginLeft: 10 },
});

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function PerfilTab({ onLogout }: { onLogout: () => void }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <View style={pf.wrapper}>
        <View style={pf.avatar}>
          <Ionicons name="briefcase-outline" size={38} color={C.purple} />
        </View>
        <Text style={pf.name}>HiGo Admin</Text>
        <View style={pf.rolePill}>
          <Text style={pf.roleText}>Administrador</Text>
        </View>
      </View>

      <View style={pf.card}>
        <PerfilRow icon="mail-outline"              label="Email"    value="admin@higo.com" />
        <View style={pf.divider} />
        <PerfilRow icon="call-outline"              label="Teléfono" value="+593 99 000 0000" />
        <View style={pf.divider} />
        <PerfilRow icon="shield-checkmark-outline"  label="Rol"      value="Administrador" valueColor={C.purple} />
        <View style={pf.divider} />
        <PerfilRow icon="business-outline"          label="Sistema"  value="HiGo v1.0" valueColor={C.greenDark} />
      </View>

      <TouchableOpacity style={pf.logoutBtn} activeOpacity={0.85} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#E74C3C" />
        <Text style={pf.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function PerfilRow({
  icon, label, value, valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={pf.row}>
      <View style={pf.rowIcon}>
        <Ionicons name={icon} size={18} color={C.purple} />
      </View>
      <Text style={pf.rowLabel}>{label}</Text>
      <Text style={[pf.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const pf = StyleSheet.create({
  wrapper:   { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatar:    { width: 80, height: 80, borderRadius: 40, backgroundColor: C.purpleFaint, borderWidth: 3, borderColor: C.purpleBorder, alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  rolePill:  { backgroundColor: C.purpleFaint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: C.purpleBorder },
  roleText:  { fontSize: 13, fontWeight: '700', color: C.purple },
  card:      { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.purpleBorder, overflow: 'hidden' },
  divider:   { height: 1, backgroundColor: '#F0F0F0' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.purpleFaint, alignItems: 'center', justifyContent: 'center' },
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
        <Ionicons name={active ? activeIcon : icon} size={24} color={active ? C.purple : '#9B9B9B'} />
        {badge > 0 && (
          <View style={tb.badge}>
            <Text style={tb.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tb.label, active && { color: C.purple }]}>{label}</Text>
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

export default function AdminPayScreen({ navigation }: Props) {
  const [activeTab,  setActiveTab]  = useState<Tab>('pagos');
  const [disponible, setDisponible] = useState(true);

  const { operators } = useAdminPayStore();
  const pendingCount  = operators.filter(o => !o.isPaid).length;

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
            <Ionicons name="briefcase-outline" size={22} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Administrador</Text>
            <Text style={styles.headerName}>HiGo Admin</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.disponibleBadge, !disponible && styles.noDisponibleBadge]}
          activeOpacity={0.8}
          onPress={() => setDisponible(!disponible)}
        >
          <View style={[styles.disponibleDot, !disponible && styles.noDisponibleDot]} />
          <Text style={[styles.disponibleText, !disponible && styles.noDisponibleText]}>
            {disponible ? 'Sistema activo' : 'Mantenimiento'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Contenido ── */}
      <View style={styles.body}>
        {activeTab === 'pagos'    && <PagosTab />}
        {activeTab === 'finanzas' && <FinanzasTab navigation={navigation} />}
        {activeTab === 'perfil'   && <PerfilTab onLogout={handleLogout} />}
      </View>

      {/* ── Bottom tab bar ── */}
      <View style={styles.tabBar}>
        <TabBarItem
          icon="card-outline"
          label="Pagos"
          active={activeTab === 'pagos'}
          badge={pendingCount}
          onPress={() => setActiveTab('pagos')}
        />
        <TabBarItem
          icon="cash-outline"
          label="Finanzas"
          active={activeTab === 'finanzas'}
          onPress={() => setActiveTab('finanzas')}
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
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.header,
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

  body:   { flex: 1, backgroundColor: C.bg },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: C.purpleBorder, paddingBottom: 4, paddingTop: 6 },
});

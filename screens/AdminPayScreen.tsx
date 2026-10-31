import {
  useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  StatusBar,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAdminPayStore, Operator } from '../store/adminPayStore';
import { useAdminFinanzasStore } from '../store/adminFinanzasStore';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { cardShadow } from '../theme/elevation';
import { ThemeColors } from '../theme/colors';
import { formatShortDate, nextPayFriday } from '../utils/earnings';
import { pickAvatarPhoto } from '../lib/pickAvatarPhoto';
import Avatar from '../components/Avatar';
import AppearanceSelector from '../components/AppearanceSelector';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

type Tab    = 'pagos' | 'finanzas' | 'perfil';
type Filter = 'todos' | 'cocheros' | 'transportistas';

const ROLE_LABEL: Record<string, string> = {
  cochero: 'Cochero', transportista: 'Transportista',
};
const ROLE_COLOR: Record<string, string> = {
  cochero: '#1A5C2A', transportista: '#5C3D08',
};

// ─── Tab: Pagos ───────────────────────────────────────────────────────────────

function PagosTab() {
  const C = useThemeColors();
  const p = makePagosStyles(C);
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
          <Ionicons name="calendar-outline" size={14} color={C.primary} />
          <Text style={p.nextPayText}>Próximo pago viernes: {fridayLabel}</Text>
        </View>

        {/* Summary */}
        <View style={p.summaryRow}>
          <View style={[p.summaryCard, { backgroundColor: C.warningFaint }]}>
            <View style={[p.summaryIconBox, { backgroundColor: 'rgba(230,126,34,0.15)' }]}>
              <Ionicons name="time-outline" size={18} color="#E67E22" />
            </View>
            <Text style={p.summaryLabel}>Por pagar</Text>
            <Text style={[p.summaryAmount, { color: '#E67E22' }]}>${totalPending.toFixed(2)}</Text>
            <Text style={p.summaryCount}>{pending.length} operador{pending.length !== 1 ? 'es' : ''}</Text>
          </View>
          <View style={[p.summaryCard, { backgroundColor: C.successFaint }]}>
            <View style={[p.summaryIconBox, { backgroundColor: 'rgba(26,92,42,0.12)' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#1A5C2A" />
            </View>
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
            <View style={[p.opAccent, { backgroundColor: ROLE_COLOR[op.role] }]} />
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
                    <Ionicons name="checkmark" size={14} color={C.white} />
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

const makePagosStyles = (C: ThemeColors) => StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 24 },

  nextPayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryFaint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  nextPayText:{ fontSize: 13, fontWeight: '600', color: C.primary },

  summaryRow:   { flexDirection: 'row', gap: 12 },
  summaryCard:  {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4,
    ...cardShadow(C),
  },
  summaryIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  summaryAmount:{ fontSize: 26, fontWeight: '800' },
  summaryCount: { fontSize: 12, color: C.textFaint },

  tabs:        { flexDirection: 'row', backgroundColor: C.primaryFaint, borderRadius: 12, padding: 4, gap: 2 },
  tab:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive:   { backgroundColor: C.primary },
  tabText:     { fontSize: 13, fontWeight: '600', color: C.primary },
  tabTextActive:{ color: C.white },

  opCard:    { backgroundColor: C.surface, borderRadius: 16, padding: 16, paddingLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', ...cardShadow(C) },
  opCardPaid:{ opacity: 0.7 },
  opAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  opLeft:    { flex: 1, gap: 4 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 2 },
  roleBadgeText: { color: C.white, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  opName:    { fontSize: 16, fontWeight: '700', color: C.text },
  opMeta:    { fontSize: 12, color: C.textFaint },
  opRight:   { alignItems: 'flex-end', gap: 6, marginLeft: 12 },

  pendingAmount: { fontSize: 22, fontWeight: '800', color: '#E67E22' },
  payBtn:        { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  payBtnText:    { color: C.white, fontSize: 13, fontWeight: '700' },
  paidAmount:    { fontSize: 22, fontWeight: '800', color: C.success },
  paidBadge:     { backgroundColor: C.successFaint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  paidBadgeText: { color: '#1A5C2A', fontSize: 12, fontWeight: '700' },

  historySection:{ backgroundColor: C.surface, borderRadius: 18, padding: 16, ...cardShadow(C), marginTop: 4 },
  historyTitle:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  historyRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  historyLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  historyDot:    { width: 10, height: 10, borderRadius: 5 },
  historyName:   { fontSize: 14, fontWeight: '600', color: C.text },
  historyMeta:   { fontSize: 11, color: C.textFaint, marginTop: 1 },
  historyRight:  { alignItems: 'flex-end', gap: 1 },
  historyAmount: { fontSize: 15, fontWeight: '700', color: C.primary },
  historyDate:   { fontSize: 11, color: C.textFaint },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal:   { backgroundColor: C.surface, borderRadius: 20, padding: 24, width: '100%', gap: 16 },
  modalTitle:       { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
  modalBody:        { fontSize: 15, color: C.textSoft, textAlign: 'center', lineHeight: 22 },
  modalName:        { fontWeight: '700', color: C.primary },
  modalAmountRow:   { backgroundColor: C.primaryFaint, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  modalAmountLabel: { fontSize: 12, color: C.textFaint, fontWeight: '500' },
  modalAmount:      { fontSize: 32, fontWeight: '800', color: C.primary },
  modalBtns:        { flexDirection: 'row', gap: 10 },
  modalBtn:         { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancel:        { backgroundColor: C.primaryFaint },
  modalBtnCancelText:    { color: C.primary, fontSize: 15, fontWeight: '600' },
  modalBtnConfirm:       { backgroundColor: C.primary },
  modalBtnConfirmText:   { color: C.white, fontSize: 15, fontWeight: '700' },
});

// ─── Tab: Finanzas ────────────────────────────────────────────────────────────

function FinanzasTab({
  navigation,
}: {
  navigation: StackNavigationProp<RootStackParamList, 'AdminDashboard'>;
}) {
  const C = useThemeColors();
  const fi = makeFinanzasStyles(C);
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
        <Text style={fi.cardSub}>
          {current.ordersCount} pedidos entregados
          {current.inProgressCount > 0 ? ` · ${current.inProgressCount} en curso` : ''}
        </Text>

        <View style={fi.divider} />
        <Text style={fi.subSection}>Egresos a operadores</Text>
        <FinRow icon="cube-outline"     label="Comerciantes"      amount={current.toComerciantes}   color="#E65100" />
        <FinRow icon="bicycle-outline"  label="Cocheros"          amount={current.toCocheros}       color="#1A5C2A" />
        <FinRow icon="car-outline"      label="Transportistas"    amount={current.toTransportistas}  color="#5C3D08" />

        <View style={fi.divider} />
        <Text style={fi.subSection}>Resultado HiGo</Text>
        <FinRow icon="briefcase-outline" label="Margen gestión (7%)" amount={current.higoGross}         color={C.primary} />
        <FinRow icon="bicycle-outline"   label="Pago a cocheros"     amount={-current.toCocheros}       color="#C62828" />

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
        <Ionicons name="bar-chart-outline" size={18} color={C.primary} />
        <Text style={fi.navBtnText}>Ver historial de 8 semanas</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={C.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={fi.navBtn} activeOpacity={0.8} onPress={() => navigation.navigate('AdminSolicitudes')}>
        <Ionicons name="document-text-outline" size={18} color={C.primary} />
        <Text style={fi.navBtnText}>Ver solicitudes operativas</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={C.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={fi.navBtn} activeOpacity={0.8} onPress={() => navigation.navigate('AdminProductos')}>
        <Ionicons name="pricetags-outline" size={18} color={C.primary} />
        <Text style={fi.navBtnText}>Administrar catálogo de productos</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={C.primary} />
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function FinChip({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  const fi = makeFinanzasStyles(useThemeColors());
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
  const C = useThemeColors();
  const fi = makeFinanzasStyles(C);
  const isNeg = amount < 0;
  return (
    <View style={fi.row}>
      <View style={fi.rowLeft}>
        <Ionicons name={icon} size={14} color={C.textSoft} />
        <Text style={fi.rowLabel}>{label}</Text>
      </View>
      <Text style={[fi.rowAmount, { color }]}>{isNeg ? '-' : ''}${Math.abs(amount).toFixed(2)}</Text>
    </View>
  );
}

const makeFinanzasStyles = (C: ThemeColors) => StyleSheet.create({
  scroll:    { padding: 16, gap: 12, paddingBottom: 24 },
  chipsRow:  { flexDirection: 'row', gap: 8 },
  chip:      { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  chipValue: { fontSize: 16, fontWeight: '800' },
  chipLabel: { fontSize: 11, marginTop: 2, opacity: 0.8 },

  card:       { backgroundColor: C.surface, borderRadius: 18, padding: 16, ...cardShadow(C) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
  pendingPill:{ backgroundColor: C.warningFaint, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pendingPillText: { fontSize: 11, fontWeight: '700', color: '#8B5E00' },
  cardSub:    { fontSize: 12, color: C.textFaint, marginTop: 2 },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: 10 },
  subSection: { fontSize: 11, fontWeight: '700', color: C.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  rowLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rowLabel:  { fontSize: 14, color: C.textSoft },
  rowAmount: { fontSize: 14, fontWeight: '700' },

  netRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:  { fontSize: 15, fontWeight: '700', color: C.text },
  netAmount: { fontSize: 18, fontWeight: '800' },

  navBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, ...cardShadow(C) },
  navBtnText:{ flex: 1, fontSize: 15, fontWeight: '600', color: C.primary, marginLeft: 10 },
});

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function PerfilTab({ onLogout }: { onLogout: () => void }) {
  const C = useThemeColors();
  const pf = makePerfilStyles(C);
  const user = useAuthStore((s) => s.user);
  const updatePhoto = useAuthStore((s) => s.updatePhoto);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <View style={pf.wrapper}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => pickAvatarPhoto(updatePhoto)}>
          <View style={pf.avatarWrapper}>
            <Avatar name={user?.name} photoUri={user?.photoUri} size={80} bg={C.primaryFaint} textColor={C.primary} />
            <View style={pf.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={C.white} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={pf.name}>{user?.name ?? 'Admin'}</Text>
        <View style={pf.rolePill}>
          <Text style={pf.roleText}>Administrador</Text>
        </View>
      </View>

      <View style={pf.card}>
        <PerfilRow icon="mail-outline"              label="Email"    value={user?.email ?? '—'} />
        <View style={pf.divider} />
        <PerfilRow icon="call-outline"              label="Teléfono" value={user?.phone ?? '—'} />
        <View style={pf.divider} />
        <PerfilRow icon="shield-checkmark-outline"  label="Rol"      value="Administrador" valueColor={C.primary} />
        <View style={pf.divider} />
        <PerfilRow icon="business-outline"          label="Sistema"  value="HiGo v1.0" valueColor={C.success} />
      </View>

      <Text style={pf.sectionLabel}>Apariencia</Text>
      <AppearanceSelector accentColor={C.primary} />

      <TouchableOpacity style={pf.logoutBtn} activeOpacity={0.85} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={C.danger} />
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
  const C = useThemeColors();
  const pf = makePerfilStyles(C);
  return (
    <View style={pf.row}>
      <View style={pf.rowIcon}>
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <Text style={pf.rowLabel}>{label}</Text>
      <Text style={[pf.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const makePerfilStyles = (C: ThemeColors) => StyleSheet.create({
  wrapper:   { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatarWrapper: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.background,
  },
  name:      { fontSize: 22, fontWeight: '800', color: C.text },
  rolePill:  { backgroundColor: C.primaryFaint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  roleText:  { fontSize: 13, fontWeight: '700', color: C.primary },
  card:      { backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  divider:   { height: 1, backgroundColor: C.border },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  rowLabel:  { flex: 1, fontSize: 14, color: C.textFaint },
  rowValue:  { fontSize: 14, fontWeight: '700', color: C.text },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 2 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.dangerFaint, borderRadius: 14, paddingVertical: 14, backgroundColor: C.dangerFaint, marginTop: 4 },
  logoutText:{ fontSize: 15, fontWeight: '700', color: C.danger },
});

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

function TabBarItem({
  icon, label, active, badge = 0, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; active: boolean; badge?: number; onPress: () => void;
}) {
  const C = useThemeColors();
  const tb = makeTabBarStyles(C);
  const activeIcon = icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap;
  return (
    <TouchableOpacity style={tb.item} activeOpacity={0.7} onPress={onPress}>
      <View style={tb.iconWrapper}>
        <Ionicons name={active ? activeIcon : icon} size={24} color={active ? C.primary : C.textFaint} />
        {badge > 0 && (
          <View style={tb.badge}>
            <Text style={tb.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tb.label, active && { color: C.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeTabBarStyles = (C: ThemeColors) => StyleSheet.create({
  item:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  iconWrapper: { position: 'relative' },
  badge:       { position: 'absolute', top: -4, right: -8, backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:   { fontSize: 10, fontWeight: '800', color: C.white },
  label:       { fontSize: 11, fontWeight: '600', color: C.textFaint },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AdminPayScreen({ navigation }: Props) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const [activeTab,  setActiveTab]  = useState<Tab>('pagos');
  const [disponible, setDisponible] = useState(true);

  const user = useAuthStore((s) => s.user);

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
      <StatusBar barStyle={C.statusBarStyle} />

      {/* ── Header ── */}
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user?.name} photoUri={user?.photoUri} size={46} />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerGreeting}>Administrador</Text>
            <Text style={styles.headerName} numberOfLines={1} ellipsizeMode="tail">
              {user?.name ?? 'Admin'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.disponibleBadge, !disponible && styles.noDisponibleBadge]}
          activeOpacity={0.8}
          onPress={() => setDisponible(!disponible)}
        >
          <View style={[styles.disponibleDot, !disponible && styles.noDisponibleDot]} />
          <Text style={[styles.disponibleText, !disponible && styles.noDisponibleText]} numberOfLines={1}>
            {disponible ? 'Activo' : 'Pausado'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

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

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  header: {
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 12 },
  headerTextBlock:{ flex: 1 },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerName:     { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  disponibleBadge:   { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(46,204,113,0.2)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  noDisponibleBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' },
  disponibleDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  noDisponibleDot:   { backgroundColor: 'rgba(255,255,255,0.5)' },
  disponibleText:    { fontSize: 13, fontWeight: '700', color: '#2ECC71' },
  noDisponibleText:  { color: 'rgba(255,255,255,0.6)' },

  body:   {
    flex: 1,
    backgroundColor: C.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -14,
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: C.surface, paddingBottom: 4, paddingTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
});

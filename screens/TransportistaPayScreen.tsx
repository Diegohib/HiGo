import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useTransportistaStore, DayRecordT } from '../store/transportistaStore';
import { useAuthStore } from '../store/authStore';
import {
  TRANSPORTISTA_BASE,
  TRANSPORTISTA_PER_KM,
  nextPayFriday,
  formatShortDate,
  isToday,
  isPast,
} from '../utils/earnings';

// ─── Paleta Transportista ─────────────────────────────────────────────────────

const C = {
  header:       '#8B6914',
  headerDark:   '#5C3D08',
  amber:        '#F2C94C',
  amberFaint:   '#FFFAE0',
  amberLight:   '#FCE9A0',
  amberBorder:  '#F0D98A',
  green:        '#2ECC71',
  greenDark:    '#27AE60',
  greenFaint:   '#EAFAF1',
  bg:           '#FFFBF0',
  text:         '#1A1A1A',
  textMid:      '#4A4A4A',
  textSoft:     '#888888',
  white:        '#FFFFFF',
  future:       '#F5F5F5',
  futureBorder: '#E0E0E0',
  futureText:   '#BBBBBB',
  tabActive:    '#8B6914',
  tabInactive:  '#9B9B9B',
};

type Tab = 'entregas' | 'ganancias' | 'perfil';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'TransportistaDashboard'>;
};

// ─── Tab: Entregas (placeholder) ─────────────────────────────────────────────

function EntregasTab({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Ionicons name="cube-outline" size={56} color={C.header} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center' }}>
        Entregas del día
      </Text>
      <Text style={{ fontSize: 14, color: C.textSoft, textAlign: 'center', lineHeight: 20 }}>
        Accedé a tus entregas activas desde el dashboard principal.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: C.header, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }}
        activeOpacity={0.85}
        onPress={onBack}
      >
        <Text style={{ color: C.white, fontSize: 15, fontWeight: '700' }}>Ir al Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Tab: Ganancias ───────────────────────────────────────────────────────────

function GananciasTab() {
  const {
    weekRecords,
    weeklyEarnings,
    weeklyKm,
    todayEarnings,
    todayDeliveriesCount,
    todayKm,
    totalDeliveriesCount,
  } = useTransportistaStore();

  const payFriday = nextPayFriday();
  const weekLabel = buildWeekLabel(weekRecords);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingBottom: 32, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Próximo pago */}
      <View style={gs.payRow}>
        <Ionicons name="calendar-outline" size={14} color={C.greenDark} />
        <Text style={gs.payText}>Próximo pago: {formatShortDate(payFriday)}</Text>
        <Text style={gs.weekLabel}>{weekLabel}</Text>
      </View>

      {/* Saldo semanal */}
      <View style={gs.totalCard}>
        <Text style={gs.totalLabel}>Saldo acumulado esta semana</Text>
        <Text style={gs.totalAmount}>${weeklyEarnings.toFixed(2)}</Text>
        <View style={gs.totalStatsRow}>
          <View style={gs.totalStat}>
            <Ionicons name="navigate-outline" size={14} color={C.greenDark} />
            <Text style={gs.totalStatText}>{weeklyKm.toFixed(1)} km recorridos</Text>
          </View>
          <View style={gs.totalStatDot} />
          <View style={gs.totalStat}>
            <Ionicons name="checkmark-circle" size={14} color={C.greenDark} />
            <Text style={gs.totalStatText}>{totalDeliveriesCount} entregas</Text>
          </View>
        </View>
        <WeekProgressBar current={weeklyEarnings} />
      </View>

      {/* Resumen de hoy */}
      <Text style={gs.sectionTitle}>Hoy</Text>
      <View style={gs.todayRow}>
        <View style={[gs.todayCard, { flex: 1 }]}>
          <Ionicons name="cube-outline" size={22} color={C.header} />
          <Text style={gs.todayCardValue}>{todayDeliveriesCount}</Text>
          <Text style={gs.todayCardLabel}>Entregas hoy</Text>
        </View>
        <View style={[gs.todayCard, { flex: 1 }]}>
          <Ionicons name="navigate-outline" size={22} color={C.header} />
          <Text style={gs.todayCardValue}>{todayKm.toFixed(1)}</Text>
          <Text style={gs.todayCardLabel}>km hoy</Text>
        </View>
        <View style={[gs.todayCard, gs.todayCardGreen, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={22} color={C.white} />
          <Text style={[gs.todayCardValue, { color: C.white }]}>${todayEarnings.toFixed(2)}</Text>
          <Text style={[gs.todayCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Ganancia hoy</Text>
        </View>
      </View>

      {/* Semana completa */}
      <Text style={gs.sectionTitle}>Semana completa</Text>
      <View style={{ gap: 8 }}>
        {weekRecords.map((record, idx) => (
          <DayCard key={idx} record={record} />
        ))}
      </View>

      {/* Tarifa */}
      <Text style={gs.sectionTitle}>Tarifa por entrega</Text>
      <View style={gs.tarifaCard}>
        <View style={gs.formulaRow}>
          <View style={gs.formulaChip}>
            <Text style={gs.formulaChipLabel}>Base fija</Text>
            <Text style={gs.formulaChipValue}>${TRANSPORTISTA_BASE.toFixed(2)}</Text>
          </View>
          <Ionicons name="add" size={20} color={C.textSoft} />
          <View style={gs.formulaChip}>
            <Text style={gs.formulaChipLabel}>Por km</Text>
            <Text style={gs.formulaChipValue}>${TRANSPORTISTA_PER_KM.toFixed(2)}</Text>
          </View>
        </View>
        <View style={gs.tarifaDivider} />
        {EXAMPLE_ROUTES.map((ex, i) => (
          <View key={i} style={[gs.exRow, i < EXAMPLE_ROUTES.length - 1 && gs.exRowBorder]}>
            <View style={gs.exLeft}>
              <View style={gs.exKmBadge}>
                <Text style={gs.exKmText}>{ex.km} km</Text>
              </View>
              <Text style={gs.exLabel}>{ex.label}</Text>
            </View>
            <Text style={gs.exEarning}>
              +${(TRANSPORTISTA_BASE + TRANSPORTISTA_PER_KM * ex.km).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={gs.tarifaFooter}>
          <Ionicons name="information-circle-outline" size={13} color={C.textSoft} />
          <Text style={gs.tarifaFooterText}>
            Distancia medida desde el Mercado Mayorista hasta la puerta del cliente
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function PerfilTab({ onLogout }: { onLogout: () => void }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={pf.wrapper}>
        <View style={pf.avatar}>
          <Ionicons name="car" size={38} color={C.header} />
        </View>
        <Text style={pf.name}>Roberto Mendoza</Text>
        <View style={pf.rolePill}>
          <Text style={pf.roleText}>Transportista</Text>
        </View>
      </View>

      <View style={pf.card}>
        <PerfilRow icon="call-outline"             label="Teléfono"   value="+593 98 765 4321" />
        <View style={pf.divider} />
        <PerfilRow icon="card-outline"             label="Cédula"     value="17XXXXXXXX" />
        <View style={pf.divider} />
        <PerfilRow icon="car-outline"              label="Vehículo"   value="Camioneta D-MAX" />
        <View style={pf.divider} />
        <PerfilRow icon="document-text-outline"    label="Matrícula"  value="PBA-2341" />
        <View style={pf.divider} />
        <PerfilRow icon="shield-checkmark-outline" label="Estado"     value="Verificado" valueColor={C.greenDark} />
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
        <Ionicons name={icon} size={18} color={C.header} />
      </View>
      <Text style={pf.rowLabel}>{label}</Text>
      <Text style={[pf.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const pf = StyleSheet.create({
  wrapper:   { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatar:    { width: 80, height: 80, borderRadius: 40, backgroundColor: C.amberFaint, borderWidth: 3, borderColor: C.amberBorder, alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: 22, fontWeight: '800', color: C.text },
  rolePill:  { backgroundColor: C.amberFaint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: C.amberBorder },
  roleText:  { fontSize: 13, fontWeight: '700', color: C.header },
  card:      { backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.amberBorder, overflow: 'hidden' },
  divider:   { height: 1, backgroundColor: '#F0F0F0' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.amberFaint, alignItems: 'center', justifyContent: 'center' },
  rowLabel:  { flex: 1, fontSize: 14, color: C.textSoft },
  rowValue:  { fontSize: 14, fontWeight: '700', color: C.text },
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
        <Ionicons name={active ? activeIcon : icon} size={24} color={active ? C.tabActive : C.tabInactive} />
        {badge > 0 && (
          <View style={tb.badge}>
            <Text style={tb.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tb.label, active && { color: C.tabActive }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const tb = StyleSheet.create({
  item:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  iconWrapper: { position: 'relative' },
  badge:       { position: 'absolute', top: -4, right: -8, backgroundColor: '#E74C3C', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:   { fontSize: 10, fontWeight: '800', color: C.white },
  label:       { fontSize: 11, fontWeight: '600', color: C.tabInactive },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function TransportistaPayScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('ganancias');
  const [disponible, setDisponible] = useState(true);

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
            <Ionicons name="car" size={22} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerName}>Roberto Mendoza</Text>
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

      {/* ── Contenido ── */}
      <View style={styles.body}>
        {activeTab === 'entregas'  && <EntregasTab onBack={() => navigation.goBack()} />}
        {activeTab === 'ganancias' && <GananciasTab />}
        {activeTab === 'perfil'    && <PerfilTab onLogout={handleLogout} />}
      </View>

      {/* ── Bottom tab bar ── */}
      <View style={styles.tabBar}>
        <TabBarItem
          icon="cube-outline"
          label="Entregas"
          active={activeTab === 'entregas'}
          onPress={() => setActiveTab('entregas')}
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

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function DayCard({ record }: { record: DayRecordT }) {
  const today  = isToday(record.date);
  const past   = isPast(record.date);
  const future = !today && !past;

  const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayName   = DAY_SHORT[record.date.getDay()];
  const dayNum    = record.date.getDate();

  return (
    <View style={[gs.dayCard, today && gs.dayCardToday, future && gs.dayCardFuture]}>
      <View style={[gs.dayDot, today && gs.dayDotToday, future && gs.dayDotFuture]} />
      <View style={gs.dayLabel}>
        <Text style={[gs.dayName, future && gs.dayTextFuture]}>{dayName}</Text>
        <Text style={[gs.dayNum,  future && gs.dayTextFuture]}>{dayNum}</Text>
      </View>
      {future ? (
        <Text style={gs.dayPending}>Pendiente</Text>
      ) : (
        <>
          <View style={gs.dayMeta}>
            <View style={gs.dayMetaRow}>
              <Ionicons name="cube-outline" size={12} color={today ? C.header : C.textSoft} />
              <Text style={[gs.dayMetaText, today && gs.dayMetaTextToday]}>
                {record.deliveriesCount} {record.deliveriesCount === 1 ? 'entrega' : 'entregas'}
              </Text>
            </View>
            <View style={gs.dayMetaRow}>
              <Ionicons name="navigate-outline" size={12} color={today ? C.header : C.textSoft} />
              <Text style={[gs.dayMetaText, today && gs.dayMetaTextToday]}>
                {record.totalKm.toFixed(1)} km
              </Text>
            </View>
          </View>
          <Text style={[gs.dayEarning, today && gs.dayEarningToday]}>
            ${record.earnings.toFixed(2)}
          </Text>
        </>
      )}
      {today && (
        <View style={gs.todayTag}>
          <Text style={gs.todayTagText}>Hoy</Text>
        </View>
      )}
    </View>
  );
}

const WEEKLY_TARGET = 100;

function WeekProgressBar({ current }: { current: number }) {
  const pct = Math.min(current / WEEKLY_TARGET, 1);
  return (
    <View style={{ gap: 5, marginTop: 6 }}>
      <View style={gs.progressTrack}>
        <View style={[gs.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
      <Text style={gs.progressLabel}>
        {Math.round(pct * 100)}% del objetivo semanal (${WEEKLY_TARGET})
      </Text>
    </View>
  );
}

const EXAMPLE_ROUTES = [
  { km:  3,  label: 'Entrega corta (barrio cercano)' },
  { km:  7,  label: 'Entrega media (otro sector)'    },
  { km: 12,  label: 'Entrega larga (otro extremo)'   },
  { km: 20,  label: 'Entrega extra larga'             },
];

function buildWeekLabel(records: DayRecordT[]): string {
  if (records.length === 0) return '';
  const first  = records[0].date;
  const last   = records[records.length - 1].date;
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${months[first.getMonth()]}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} – ${last.getDate()} ${months[last.getMonth()]}`;
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
  headerName:     { fontSize: 17, fontWeight: '800', color: C.white },

  disponibleBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(46,204,113,0.2)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  noDisponibleBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' },
  disponibleDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  noDisponibleDot:   { backgroundColor: 'rgba(255,255,255,0.5)' },
  disponibleText:    { fontSize: 13, fontWeight: '700', color: '#2ECC71' },
  noDisponibleText:  { color: 'rgba(255,255,255,0.6)' },

  body:   { flex: 1, backgroundColor: C.bg },
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.amberBorder, paddingBottom: 4, paddingTop: 6 },
});

// Estilos de la tab Ganancias
const gs = StyleSheet.create({
  payRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.amberFaint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  payText:   { fontSize: 13, fontWeight: '600', color: C.headerDark, flex: 1 },
  weekLabel: { fontSize: 12, color: C.textSoft, fontWeight: '500' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textSoft, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },

  totalCard: { backgroundColor: C.white, borderRadius: 20, padding: 22, borderWidth: 1.5, borderColor: C.amberBorder, gap: 6, shadowColor: C.header, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  totalLabel: { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  totalAmount: { fontSize: 48, fontWeight: '800', color: C.green, letterSpacing: -1 },
  totalStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalStat:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalStatText: { fontSize: 13, color: C.greenDark, fontWeight: '600' },
  totalStatDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: C.greenDark },

  progressTrack: { height: 7, backgroundColor: C.amberFaint, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: C.textSoft },

  todayRow: { flexDirection: 'row', gap: 10 },
  todayCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: C.amberBorder, shadowColor: C.header, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  todayCardGreen: { backgroundColor: C.green, borderColor: C.greenDark },
  todayCardValue: { fontSize: 22, fontWeight: '800', color: C.text },
  todayCardLabel: { fontSize: 11, color: C.textSoft, fontWeight: '600', textAlign: 'center' },

  dayCard:       { backgroundColor: C.white, borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 1.5, borderColor: C.amberBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  dayCardToday:  { borderColor: C.amber, backgroundColor: C.amberFaint },
  dayCardFuture: { backgroundColor: C.future, borderColor: C.futureBorder, shadowOpacity: 0, elevation: 0 },
  dayDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: C.amberLight, flexShrink: 0 },
  dayDotToday:   { backgroundColor: C.amber, width: 12, height: 12, borderRadius: 6 },
  dayDotFuture:  { backgroundColor: C.futureBorder },
  dayLabel:      { width: 36, alignItems: 'center', gap: 1 },
  dayName:       { fontSize: 13, fontWeight: '700', color: C.textMid },
  dayNum:        { fontSize: 11, color: C.textSoft },
  dayTextFuture: { color: C.futureText },
  dayMeta:           { flex: 1, gap: 3 },
  dayMetaRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayMetaText:       { fontSize: 12, color: C.textSoft },
  dayMetaTextToday:  { color: C.header, fontWeight: '600' },
  dayEarning:        { fontSize: 17, fontWeight: '800', color: C.textMid },
  dayEarningToday:   { color: C.green },
  dayPending:        { flex: 1, fontSize: 12, color: C.futureText, fontStyle: 'italic' },
  todayTag:          { backgroundColor: C.amber, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  todayTagText:      { fontSize: 10, fontWeight: '800', color: C.headerDark },

  tarifaCard:   { backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.amberBorder, overflow: 'hidden' },
  formulaRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 },
  formulaChip:  { backgroundColor: C.amberFaint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 2 },
  formulaChipLabel: { fontSize: 10, color: C.textSoft, fontWeight: '600', textTransform: 'uppercase' },
  formulaChipValue: { fontSize: 17, fontWeight: '800', color: C.headerDark },
  tarifaDivider:{ height: 1, backgroundColor: C.amberFaint },
  exRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  exRowBorder:  { borderBottomWidth: 1, borderBottomColor: C.amberFaint },
  exLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  exKmBadge:    { backgroundColor: C.amberLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, minWidth: 48, alignItems: 'center' },
  exKmText:     { fontSize: 13, fontWeight: '800', color: C.headerDark },
  exLabel:      { fontSize: 13, color: C.textMid, flex: 1 },
  exEarning:    { fontSize: 15, fontWeight: '800', color: C.greenDark },
  tarifaFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, padding: 12, backgroundColor: C.amberFaint },
  tarifaFooterText: { flex: 1, fontSize: 11, color: C.textSoft, lineHeight: 16 },
});

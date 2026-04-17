import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useTransportistaStore, DayRecordT } from '../store/transportistaStore';
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
  bg:           '#FFFBF0',
  headerBg:     '#5C3D08',
  headerMid:    '#8B6914',
  amber:        '#F2C94C',
  amberFaint:   '#FFFAE0',
  amberLight:   '#FCE9A0',
  green:        '#2ECC71',   // balance siempre en verde, como especificado
  greenDark:    '#27AE60',
  greenFaint:   '#EAFAF1',
  text:         '#1A1A1A',
  textMid:      '#4A4A4A',
  textSoft:     '#888888',
  white:        '#FFFFFF',
  cardBorder:   '#F0D98A',
  future:       '#F5F5F5',
  futureBorder: '#E0E0E0',
  futureText:   '#BBBBBB',
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'TransportistaDashboard'>;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TransportistaPayScreen({ navigation }: Props) {
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={C.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🚚</Text>
          <Text style={styles.headerTitle}>Mis Ganancias</Text>
          <Text style={styles.headerWeek}>{weekLabel}</Text>
        </View>

        {/* Badge próximo pago */}
        <View style={styles.payBadge}>
          <Ionicons name="calendar-outline" size={12} color={C.green} />
          <Text style={styles.payBadgeText}>
            Pago{'\n'}{formatShortDate(payFriday)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Saldo semanal ── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Saldo acumulado esta semana</Text>
          <Text style={styles.totalAmount}>${weeklyEarnings.toFixed(2)}</Text>

          {/* Stats de km y entregas */}
          <View style={styles.totalStatsRow}>
            <View style={styles.totalStat}>
              <Ionicons name="navigate-outline" size={14} color={C.greenDark} />
              <Text style={styles.totalStatText}>{weeklyKm.toFixed(1)} km recorridos</Text>
            </View>
            <View style={styles.totalStatDot} />
            <View style={styles.totalStat}>
              <Ionicons name="checkmark-circle" size={14} color={C.greenDark} />
              <Text style={styles.totalStatText}>{totalDeliveriesCount} entregas</Text>
            </View>
          </View>

          <WeekProgressBar current={weeklyEarnings} />
        </View>

        {/* ── Resumen de hoy ── */}
        <Text style={styles.sectionTitle}>Hoy</Text>
        <View style={styles.todayRow}>
          <View style={[styles.todayCard, { flex: 1 }]}>
            <Ionicons name="cube-outline" size={24} color={C.headerMid} />
            <Text style={styles.todayCardValue}>{todayDeliveriesCount}</Text>
            <Text style={styles.todayCardLabel}>Entregas hoy</Text>
          </View>

          <View style={[styles.todayCard, { flex: 1 }]}>
            <Ionicons name="navigate-outline" size={24} color={C.headerMid} />
            <Text style={styles.todayCardValue}>{todayKm.toFixed(1)}</Text>
            <Text style={styles.todayCardLabel}>km hoy</Text>
          </View>

          <View style={[styles.todayCard, styles.todayCardGreen, { flex: 1 }]}>
            <Ionicons name="wallet-outline" size={24} color={C.white} />
            <Text style={[styles.todayCardValue, { color: C.white }]}>
              ${todayEarnings.toFixed(2)}
            </Text>
            <Text style={[styles.todayCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>
              Ganancia hoy
            </Text>
          </View>
        </View>

        {/* ── Desglose por día ── */}
        <Text style={styles.sectionTitle}>Semana completa</Text>
        <View style={styles.weekGrid}>
          {weekRecords.map((record, idx) => (
            <DayCard key={idx} record={record} />
          ))}
        </View>

        {/* ── Tarifa de distancia ── */}
        <Text style={styles.sectionTitle}>Tarifa por entrega</Text>
        <View style={styles.tarifaCard}>

          {/* Fórmula visual */}
          <View style={styles.formulaRow}>
            <View style={styles.formulaChip}>
              <Text style={styles.formulaChipLabel}>Base fija</Text>
              <Text style={styles.formulaChipValue}>${TRANSPORTISTA_BASE.toFixed(2)}</Text>
            </View>
            <Ionicons name="add" size={20} color={C.textSoft} />
            <View style={styles.formulaChip}>
              <Text style={styles.formulaChipLabel}>Por km</Text>
              <Text style={styles.formulaChipValue}>${TRANSPORTISTA_PER_KM.toFixed(2)}</Text>
            </View>
            <Ionicons name="close" size={14} color={C.textSoft} style={{ marginBottom: 2 }} />
            <View style={styles.formulaChip}>
              <Text style={styles.formulaChipLabel}>Distancia</Text>
              <Text style={styles.formulaChipValue}>km</Text>
            </View>
          </View>

          <View style={styles.tarifaDivider} />

          {/* Ejemplos ilustrativos */}
          {EXAMPLE_ROUTES.map((ex, i) => (
            <View
              key={i}
              style={[styles.exRow, i < EXAMPLE_ROUTES.length - 1 && styles.exRowBorder]}
            >
              <View style={styles.exLeft}>
                <View style={styles.exKmBadge}>
                  <Text style={styles.exKmText}>{ex.km} km</Text>
                </View>
                <Text style={styles.exLabel}>{ex.label}</Text>
              </View>
              <Text style={styles.exEarning}>
                +${(TRANSPORTISTA_BASE + TRANSPORTISTA_PER_KM * ex.km).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.tarifaFooter}>
            <Ionicons name="information-circle-outline" size={13} color={C.textSoft} />
            <Text style={styles.tarifaFooterText}>
              Distancia medida desde el Mercado Mayorista hasta la puerta del cliente
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Subcomponente: card de día ───────────────────────────────────────────────

function DayCard({ record }: { record: DayRecordT }) {
  const today  = isToday(record.date);
  const past   = isPast(record.date);
  const future = !today && !past;

  const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayName   = DAY_SHORT[record.date.getDay()];
  const dayNum    = record.date.getDate();

  return (
    <View style={[
      styles.dayCard,
      today  && styles.dayCardToday,
      future && styles.dayCardFuture,
    ]}>
      {/* Indicador de estado */}
      <View style={[
        styles.dayDot,
        today  && styles.dayDotToday,
        future && styles.dayDotFuture,
      ]} />

      {/* Nombre del día */}
      <View style={styles.dayLabel}>
        <Text style={[styles.dayName, future && styles.dayTextFuture]}>{dayName}</Text>
        <Text style={[styles.dayNum,  future && styles.dayTextFuture]}>{dayNum}</Text>
      </View>

      {future ? (
        <Text style={styles.dayPending}>Pendiente</Text>
      ) : (
        <>
          {/* Entregas y km */}
          <View style={styles.dayMeta}>
            <View style={styles.dayMetaRow}>
              <Ionicons name="cube-outline" size={12} color={today ? C.headerMid : C.textSoft} />
              <Text style={[styles.dayMetaText, today && styles.dayMetaTextToday]}>
                {record.deliveriesCount} {record.deliveriesCount === 1 ? 'entrega' : 'entregas'}
              </Text>
            </View>
            <View style={styles.dayMetaRow}>
              <Ionicons name="navigate-outline" size={12} color={today ? C.headerMid : C.textSoft} />
              <Text style={[styles.dayMetaText, today && styles.dayMetaTextToday]}>
                {record.totalKm.toFixed(1)} km
              </Text>
            </View>
          </View>

          {/* Ganancia */}
          <Text style={[styles.dayEarning, today && styles.dayEarningToday]}>
            ${record.earnings.toFixed(2)}
          </Text>
        </>
      )}

      {today && (
        <View style={styles.todayTag}>
          <Text style={styles.todayTagText}>Hoy</Text>
        </View>
      )}
    </View>
  );
}

// ─── Subcomponente: barra de progreso ─────────────────────────────────────────

const WEEKLY_TARGET = 100;

function WeekProgressBar({ current }: { current: number }) {
  const pct = Math.min(current / WEEKLY_TARGET, 1);
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>
        {Math.round(pct * 100)}% del objetivo semanal (${WEEKLY_TARGET})
      </Text>
    </View>
  );
}

// ─── Ejemplos de rutas para la tabla de tarifa ───────────────────────────────

const EXAMPLE_ROUTES = [
  { km:  3,  label: 'Entrega corta (barrio cercano)' },
  { km:  7,  label: 'Entrega media (otro sector)'    },
  { km: 12,  label: 'Entrega larga (otro extremo)'   },
  { km: 20,  label: 'Entrega extra larga'             },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

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
  safe: { flex: 1, backgroundColor: C.headerBg },

  // ── Header
  header: {
    backgroundColor: C.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerEmoji:  { fontSize: 22 },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: C.white },
  headerWeek:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  payBadge: {
    backgroundColor: 'rgba(46,204,113,0.18)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
    alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.35)',
    minWidth: 62,
  },
  payBadgeText: {
    color: C.green, fontSize: 11, fontWeight: '700',
    textAlign: 'center', lineHeight: 14,
  },

  // ── Scroll
  scroll: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  scrollContent: { padding: 18, paddingBottom: 48, gap: 14 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4,
  },

  // ── Tarjeta total semanal
  totalCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 22, borderWidth: 1.5, borderColor: C.cardBorder, gap: 6,
    shadowColor: C.headerMid,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 4,
  },
  totalLabel:  { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  totalAmount: { fontSize: 48, fontWeight: '800', color: C.green, letterSpacing: -1 },
  totalStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalStat:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalStatText: { fontSize: 13, color: C.greenDark, fontWeight: '600' },
  totalStatDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: C.greenDark },

  // Barra de progreso
  progressWrapper: { gap: 5, marginTop: 6 },
  progressTrack: {
    height: 7, backgroundColor: C.amberFaint, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: C.textSoft },

  // ── Tarjetas de hoy
  todayRow:  { flexDirection: 'row', gap: 10 },
  todayCard: {
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: C.cardBorder,
    shadowColor: C.headerMid, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  todayCardGreen:  { backgroundColor: C.green, borderColor: C.greenDark },
  todayCardValue:  { fontSize: 22, fontWeight: '800', color: C.text },
  todayCardLabel:  { fontSize: 11, color: C.textSoft, fontWeight: '600', textAlign: 'center' },

  // ── Grid semanal
  weekGrid: { gap: 8 },
  dayCard: {
    backgroundColor: C.white, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderWidth: 1.5, borderColor: C.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
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
  dayMetaTextToday:  { color: C.headerMid, fontWeight: '600' },

  dayEarning:      { fontSize: 17, fontWeight: '800', color: C.textMid },
  dayEarningToday: { color: C.green },
  dayPending:      { flex: 1, fontSize: 12, color: C.futureText, fontStyle: 'italic' },

  todayTag: {
    backgroundColor: C.amber, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  todayTagText: { fontSize: 10, fontWeight: '800', color: C.headerBg },

  // ── Tarifa
  tarifaCard: {
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.cardBorder, overflow: 'hidden',
  },

  // Fórmula
  formulaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 18,
  },
  formulaChip: {
    backgroundColor: C.amberFaint, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  formulaChipLabel: { fontSize: 10, color: C.textSoft, fontWeight: '600', textTransform: 'uppercase' },
  formulaChipValue: { fontSize: 17, fontWeight: '800', color: C.headerBg },

  tarifaDivider: { height: 1, backgroundColor: C.amberFaint, marginHorizontal: 0 },

  // Ejemplos
  exRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  exRowBorder:  { borderBottomWidth: 1, borderBottomColor: C.amberFaint },
  exLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  exKmBadge: {
    backgroundColor: C.amberLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 48, alignItems: 'center',
  },
  exKmText:     { fontSize: 13, fontWeight: '800', color: C.headerBg },
  exLabel:      { fontSize: 13, color: C.textMid, flex: 1 },
  exEarning:    { fontSize: 15, fontWeight: '800', color: C.greenDark },

  tarifaFooter: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 5,
    padding: 12, backgroundColor: C.amberFaint,
  },
  tarifaFooterText: { flex: 1, fontSize: 11, color: C.textSoft, lineHeight: 16 },
});

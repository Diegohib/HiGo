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
import { useCocheroStore, DayRecord } from '../store/cocheroStore';
import {
  EARNING_TIERS,
  nextPayFriday,
  formatShortDate,
  isToday,
  isPast,
} from '../utils/earnings';

// ─── Paleta del Cochero ───────────────────────────────────────────────────────

const C = {
  bg:          '#F0FFF4',
  headerBg:    '#1A5C2A',
  headerLight: '#2D7A3A',
  green:       '#2ECC71',
  greenDark:   '#27AE60',
  greenFaint:  '#EAFAF1',
  greenMid:    '#A9DFBF',
  text:        '#1A1A1A',
  textMid:     '#4A4A4A',
  textSoft:    '#888888',
  white:       '#FFFFFF',
  cardBorder:  '#D5F0E0',
  future:      '#F5F5F5',
  futureBorder:'#E0E0E0',
  futureText:  '#BBBBBB',
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CocheroDashboard'>;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CocheroPayScreen({ navigation }: Props) {
  const {
    weekRecords,
    weeklyEarnings,
    todayEarnings,
    todayOrdersCount,
    totalOrdersCount,
  } = useCocheroStore();

  const payFriday  = nextPayFriday();
  const weekLabel  = buildWeekLabel(weekRecords);

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
          <Ionicons name="bicycle" size={22} color={C.white} />
          <Text style={styles.headerTitle}>Mis Ganancias</Text>
          <Text style={styles.headerWeek}>{weekLabel}</Text>
        </View>

        {/* Badge: próximo pago */}
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
          <View style={styles.totalMeta}>
            <Ionicons name="checkmark-circle" size={15} color={C.greenDark} />
            <Text style={styles.totalMetaText}>
              {totalOrdersCount} pedidos completados
            </Text>
          </View>

          {/* Barra de progreso hacia el máximo semanal estimado */}
          <WeekProgressBar current={weeklyEarnings} />
        </View>

        {/* ── Resumen de hoy ── */}
        <Text style={styles.sectionTitle}>Hoy</Text>
        <View style={styles.todayRow}>
          <View style={[styles.todayCard, { flex: 1 }]}>
            <Ionicons name="bicycle-outline" size={24} color={C.greenDark} />
            <Text style={styles.todayCardValue}>{todayOrdersCount}</Text>
            <Text style={styles.todayCardLabel}>Pedidos hoy</Text>
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

        {/* ── Tabla de tarifas ── */}
        <Text style={styles.sectionTitle}>Tarifas por pedido</Text>
        <View style={styles.tiersCard}>
          {EARNING_TIERS.map((tier, idx) => (
            <View
              key={idx}
              style={[styles.tierRow, idx < EARNING_TIERS.length - 1 && styles.tierRowBorder]}
            >
              <View style={styles.tierRange}>
                <Ionicons name="pricetag-outline" size={14} color={C.greenDark} />
                <Text style={styles.tierRangeText}>{tier.label}</Text>
              </View>
              <View style={styles.tierEarning}>
                <Text style={styles.tierEarningText}>+${tier.earning.toFixed(2)}</Text>
              </View>
            </View>
          ))}
          <View style={styles.tierFooter}>
            <Ionicons name="information-circle-outline" size={13} color={C.textSoft} />
            <Text style={styles.tierFooterText}>
              Ganancia por cada pedido entregado
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Subcomponente: card de día ───────────────────────────────────────────────

function DayCard({ record }: { record: DayRecord }) {
  const today  = isToday(record.date);
  const past   = isPast(record.date);
  const future = !today && !past;

  const DAY_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayName  = DAY_FULL[record.date.getDay()];
  const dayNum   = record.date.getDate();

  return (
    <View style={[
      styles.dayCard,
      today   && styles.dayCardToday,
      future  && styles.dayCardFuture,
    ]}>
      {/* Indicador izquierdo */}
      <View style={[
        styles.dayDot,
        today  && styles.dayDotToday,
        past   && styles.dayDotPast,
        future && styles.dayDotFuture,
      ]} />

      {/* Nombre del día */}
      <View style={styles.dayLabel}>
        <Text style={[styles.dayName, future && styles.dayNameFuture]}>{dayName}</Text>
        <Text style={[styles.dayNum,  future && styles.dayNumFuture]}>{dayNum}</Text>
      </View>

      {/* Datos o placeholder */}
      {future ? (
        <Text style={styles.dayPending}>Pendiente</Text>
      ) : (
        <>
          <View style={styles.dayOrders}>
            <Ionicons name="cube-outline" size={13} color={today ? C.greenDark : C.textSoft} />
            <Text style={[styles.dayOrdersText, today && styles.dayOrdersTextToday]}>
              {record.ordersCount} {record.ordersCount === 1 ? 'pedido' : 'pedidos'}
            </Text>
          </View>
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

const WEEKLY_TARGET = 60; // objetivo referencial para la barra

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

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildWeekLabel(records: DayRecord[]): string {
  if (records.length === 0) return '';
  const first = records[0].date;
  const last  = records[records.length - 1].date;
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${months[first.getMonth()]}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} – ${last.getDate()} ${months[last.getMonth()]}`;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.headerBg },

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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerEmoji: { fontSize: 22 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.white,
  },
  headerWeek: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  payBadge: {
    backgroundColor: 'rgba(46,204,113,0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.35)',
    minWidth: 62,
  },
  payBadgeText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Scroll
  scroll: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 48,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 4,
  },

  // ── Tarjeta total semanal
  totalCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    gap: 6,
    shadowColor: C.greenDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: C.textSoft,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: C.green,
    letterSpacing: -1,
  },
  totalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  totalMetaText: {
    fontSize: 13,
    color: C.greenDark,
    fontWeight: '600',
  },

  // Barra de progreso
  progressWrapper: { gap: 5, marginTop: 6 },
  progressTrack: {
    height: 7,
    backgroundColor: C.greenFaint,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: C.textSoft,
  },

  // ── Tarjetas de hoy
  todayRow: {
    flexDirection: 'row',
    gap: 12,
  },
  todayCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    shadowColor: C.greenDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  todayCardGreen: {
    backgroundColor: C.green,
    borderColor: C.greenDark,
  },
  todayCardValue: {
    fontSize: 30,
    fontWeight: '800',
    color: C.text,
  },
  todayCardLabel: {
    fontSize: 12,
    color: C.textSoft,
    fontWeight: '600',
  },

  // ── Grid semanal
  weekGrid: {
    gap: 8,
  },
  dayCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dayCardToday: {
    borderColor: C.green,
    backgroundColor: C.greenFaint,
  },
  dayCardFuture: {
    backgroundColor: C.future,
    borderColor: C.futureBorder,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Dot indicador de estado
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.greenMid,
    flexShrink: 0,
  },
  dayDotToday:  { backgroundColor: C.green, width: 12, height: 12, borderRadius: 6 },
  dayDotPast:   { backgroundColor: C.greenMid },
  dayDotFuture: { backgroundColor: C.futureBorder },

  // Nombre del día
  dayLabel: { width: 36, alignItems: 'center', gap: 1 },
  dayName:  { fontSize: 13, fontWeight: '700', color: C.textMid },
  dayNum:   { fontSize: 11, color: C.textSoft },
  dayNameFuture: { color: C.futureText },
  dayNumFuture:  { color: C.futureText },

  // Pedidos
  dayOrders: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayOrdersText:      { fontSize: 13, color: C.textSoft },
  dayOrdersTextToday: { color: C.greenDark, fontWeight: '600' },

  // Ganancia
  dayEarning:      { fontSize: 17, fontWeight: '800', color: C.textMid },
  dayEarningToday: { color: C.green },

  // "Pendiente" para días futuros
  dayPending: {
    flex: 1,
    fontSize: 12,
    color: C.futureText,
    fontStyle: 'italic',
  },

  // Badge "Hoy"
  todayTag: {
    backgroundColor: C.green,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  todayTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.white,
  },

  // ── Tabla de tarifas
  tiersCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  tierRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.greenFaint,
  },
  tierRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tierRangeText: {
    fontSize: 14,
    color: C.textMid,
    fontWeight: '600',
  },
  tierEarning: {
    backgroundColor: C.greenFaint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierEarningText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.greenDark,
  },
  tierFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.greenFaint,
  },
  tierFooterText: {
    fontSize: 12,
    color: C.textSoft,
  },
});

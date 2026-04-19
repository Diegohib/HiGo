import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAdminFinanzasStore, WeekFinance } from '../store/adminFinanzasStore';
import { formatShortDate, nextPayFriday } from '../utils/earnings';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AdminFinanzas'>;
};

const HEADER   = '#0D2B4A';
const ACCENT   = '#1565C0';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FlowRow({
  icon, label, amount, color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  amount: number;
  color: string;
}) {
  const isNeg = amount < 0;
  return (
    <View style={fc.flowRow}>
      <View style={fc.flowLabelRow}>
        <Ionicons name={icon} size={14} color="#555" />
        <Text style={fc.flowLabel}>{label}</Text>
      </View>
      <Text style={[fc.flowAmount, { color }]}>
        {isNeg ? '-' : ''}${Math.abs(amount).toFixed(2)}
      </Text>
    </View>
  );
}

function SummaryChip({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <View style={[fc.chip, { backgroundColor: bg }]}>
      <Text style={[fc.chipValue, { color }]}>{value}</Text>
      <Text style={[fc.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

function WeekHistoryCard({
  week, expanded, onToggle,
}: {
  week: WeekFinance; expanded: boolean; onToggle: () => void;
}) {
  return (
    <View style={fc.histCard}>
      <TouchableOpacity style={fc.histHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={fc.histLeft}>
          <View style={[fc.histBadge, week.status === 'pagado' ? fc.badgePaid : fc.badgePending]}>
            <Text style={fc.histBadgeText}>{week.status === 'pagado' ? 'Pagado' : 'Pendiente'}</Text>
          </View>
          <Text style={fc.histWeek}>{week.weekLabel}</Text>
          <Text style={fc.histOrders}>{week.ordersCount} pedidos</Text>
        </View>
        <View style={fc.histRight}>
          <Text style={fc.histIncome}>${week.totalIncome.toFixed(0)}</Text>
          <Text style={[fc.histNet, { color: week.higoNet >= 0 ? '#1B5E20' : '#B71C1C' }]}>
            neto ${week.higoNet.toFixed(2)}
          </Text>
          <Text style={fc.histChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={fc.histDetail}>
          <View style={fc.histDivider} />
          <FlowRow icon="cube-outline"       label="Comerciantes"     amount={week.toComerciantes}    color="#E65100" />
          <FlowRow icon="bicycle-outline"   label="Cocheros"         amount={week.toCocheros}        color="#1A5C2A" />
          <FlowRow icon="car-outline"       label="Transportistas"   amount={week.toTransportistas}  color="#5C3D08" />
          <View style={fc.histDivider} />
          <FlowRow icon="briefcase-outline" label="Margen 7%"        amount={week.higoGross}          color={ACCENT} />
          <FlowRow icon="settings-outline"  label="Costos operativos" amount={-week.operationalCosts} color="#C62828" />
          <View style={[fc.histDivider, { marginTop: 6 }]} />
          <View style={fc.netRow}>
            <Text style={fc.netLabel}>Ganancia neta</Text>
            <Text style={[fc.netAmount, { color: week.higoNet >= 0 ? '#1B5E20' : '#B71C1C' }]}>
              ${week.higoNet.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AdminFinanzasScreen({ navigation }: Props) {
  const { weeks }  = useAdminFinanzasStore();
  const current    = weeks[0];
  const history    = weeks.slice(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fridayLabel  = formatShortDate(nextPayFriday());
  const totalPayouts = current.toComerciantes + current.toCocheros + current.toTransportistas;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="cash-outline" size={26} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Flujo de Dinero</Text>
          <View style={styles.payDateBadge}>
            <Text style={styles.payDateText}>Próx. pago: {fridayLabel}</Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Resumen chips ── */}
        <View style={styles.chipsRow}>
          <SummaryChip
            label="Ingresos"
            value={`$${current.totalIncome.toFixed(0)}`}
            bg="#E3F2FD" color="#0D47A1"
          />
          <SummaryChip
            label="A pagar"
            value={`$${totalPayouts.toFixed(0)}`}
            bg="#FFF3E0" color="#E65100"
          />
          <SummaryChip
            label="Neto HiGo"
            value={`$${current.higoNet.toFixed(0)}`}
            bg="#E8F5E9" color="#1B5E20"
          />
        </View>

        {/* ── Semana actual ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Semana actual</Text>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>Pendiente</Text>
          </View>
        </View>

        <View style={styles.currentCard}>
          <Text style={styles.currentWeekLabel}>{current.weekLabel}</Text>
          <Text style={styles.currentOrders}>{current.ordersCount} pedidos procesados</Text>

          <View style={styles.incomeRow}>
            <Text style={styles.incomeLabel}>Ingresos totales</Text>
            <Text style={styles.incomeAmount}>${current.totalIncome.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.subHeader}>Egresos a operadores</Text>
          <FlowRow icon="cube-outline"       label="Comerciantes"        amount={current.toComerciantes}    color="#E65100" />
          <FlowRow icon="bicycle-outline"   label="Cocheros"            amount={current.toCocheros}        color="#1A5C2A" />
          <FlowRow icon="car-outline"       label="Transportistas"      amount={current.toTransportistas}  color="#5C3D08" />

          <View style={styles.divider} />
          <Text style={styles.subHeader}>Resultado HiGo</Text>
          <FlowRow icon="briefcase-outline" label="Margen gestión (7%)" amount={current.higoGross}          color={ACCENT} />
          <FlowRow icon="settings-outline"  label="Costos operativos"   amount={-current.operationalCosts}  color="#C62828" />

          <View style={[styles.divider, { marginTop: 8 }]} />
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>Ganancia neta HiGo</Text>
            <Text style={styles.netAmount}>${current.higoNet.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Historial ── */}
        <Text style={styles.sectionTitle}>Historial (8 semanas)</Text>

        {history.map((week) => (
          <WeekHistoryCard
            key={week.id}
            week={week}
            expanded={expanded === week.id}
            onToggle={() => setExpanded(expanded === week.id ? null : week.id)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos sub-componentes ──────────────────────────────────────────────────

const fc = StyleSheet.create({
  flowRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 5,
  },
  flowLabelRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, flex: 1 },
  flowLabel:  { fontSize: 14, color: '#333' },
  flowAmount: { fontSize: 14, fontWeight: '700' },
  chip: {
    flex: 1, marginHorizontal: 4, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  chipValue: { fontSize: 18, fontWeight: '800' },
  chipLabel: { fontSize: 11, marginTop: 2, opacity: 0.8 },
  histCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    elevation: 2, overflow: 'hidden',
  },
  histHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  histLeft:  { flex: 1 },
  histRight: { alignItems: 'flex-end' },
  histBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  badgePaid:    { backgroundColor: '#D4EDDA' },
  badgePending: { backgroundColor: '#FFF3CD' },
  histBadgeText:{ fontSize: 11, fontWeight: '700' },
  histWeek:     { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  histOrders:   { fontSize: 12, color: '#666', marginTop: 2 },
  histIncome:   { fontSize: 16, fontWeight: '800', color: '#0D47A1' },
  histNet:      { fontSize: 12, fontWeight: '600', marginTop: 2 },
  histChevron:  { fontSize: 11, color: '#999', marginTop: 4 },
  histDetail:   { paddingHorizontal: 14, paddingBottom: 14 },
  histDivider:  { height: 1, backgroundColor: '#E8E8E8', marginVertical: 8 },
  netRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },
  netLabel:  { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  netAmount: { fontSize: 18, fontWeight: '800', color: '#1B5E20' },
});

// ─── Estilos pantalla ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: HEADER,
    paddingTop: 52, paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn:     { width: 40, alignItems: 'flex-start' },
  backArrow:   { fontSize: 32, color: '#FFFFFF', lineHeight: 34 },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerEmoji: { fontSize: 26, marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  payDateBadge:{
    marginTop: 6, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  payDateText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  headerRight: { width: 40 },

  scroll: { padding: 16 },

  chipsRow: { flexDirection: 'row', marginBottom: 20 },

  sectionRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle:{ fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  pendingPill: {
    marginLeft: 10, backgroundColor: '#FFF3CD',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  pendingPillText: { fontSize: 12, fontWeight: '700', color: '#8B5E00' },

  currentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  currentWeekLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  currentOrders:    { fontSize: 12, color: '#888', marginBottom: 14 },

  incomeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: '#E3F2FD',
    borderRadius: 10, padding: 12,
  },
  incomeLabel:  { fontSize: 14, fontWeight: '700', color: '#0D47A1' },
  incomeAmount: { fontSize: 20, fontWeight: '900', color: '#0D47A1' },

  divider:   { height: 1, backgroundColor: '#EFEFEF', marginVertical: 12 },
  subHeader: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  netRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:  { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  netAmount: { fontSize: 22, fontWeight: '900', color: '#1B5E20' },
});

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Pressable, StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAdminPayStore, Operator } from '../store/adminPayStore';
import { formatShortDate, nextPayFriday } from '../utils/earnings';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

type Filter = 'todos' | 'cocheros' | 'transportistas';

const ROLE_LABEL: Record<string, string> = {
  cochero:       'Cochero',
  transportista: 'Transportista',
};

const ROLE_COLOR: Record<string, string> = {
  cochero:       '#1A5C2A',
  transportista: '#5C3D08',
};

export default function AdminPayScreen({ navigation }: Props) {
  const { operators, paymentHistory, markAsPaid } = useAdminPayStore();

  const [filter, setFilter]       = useState<Filter>('todos');
  const [confirm, setConfirm]     = useState<Operator | null>(null);

  // ─── Summary stats ─────────────────────────────────────────────────────────
  const pending = operators.filter(o => !o.isPaid);
  const paid    = operators.filter(o =>  o.isPaid);

  const totalPending = pending.reduce((s, o) => s + o.weekEarnings, 0);
  const totalPaid    = paid.reduce((s, o) => s + o.paidAmount, 0);

  // ─── Filtered list ──────────────────────────────────────────────────────────
  const visible = operators.filter(o => {
    if (filter === 'cocheros')       return o.role === 'cochero';
    if (filter === 'transportistas') return o.role === 'transportista';
    return true;
  });

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleConfirmPay = () => {
    if (!confirm) return;
    markAsPaid(confirm.id);
    setConfirm(null);
  };

  // ─── Friday label ───────────────────────────────────────────────────────────
  const fridayLabel = formatShortDate(nextPayFriday());

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>💼</Text>
          <Text style={styles.headerTitle}>Pagos Semanales</Text>
          <View style={styles.payDateBadge}>
            <Text style={styles.payDateText}>Pago: {fridayLabel}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Summary cards ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF3CD' }]}>
            <Text style={styles.summaryLabel}>Por pagar</Text>
            <Text style={[styles.summaryAmount, { color: '#E67E22' }]}>
              ${totalPending.toFixed(2)}
            </Text>
            <Text style={styles.summaryCount}>{pending.length} operador{pending.length !== 1 ? 'es' : ''}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#D4EDDA' }]}>
            <Text style={styles.summaryLabel}>Pagado hoy</Text>
            <Text style={[styles.summaryAmount, { color: '#1A5C2A' }]}>
              ${totalPaid.toFixed(2)}
            </Text>
            <Text style={styles.summaryCount}>{paid.length} operador{paid.length !== 1 ? 'es' : ''}</Text>
          </View>
        </View>

        {/* ── Filter tabs ── */}
        <View style={styles.tabs}>
          {(['todos', 'cocheros', 'transportistas'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && styles.tabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Operator cards ── */}
        {visible.map(op => (
          <View key={op.id} style={[styles.opCard, op.isPaid && styles.opCardPaid]}>
            <View style={styles.opLeft}>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[op.role] }]}>
                <Text style={styles.roleBadgeText}>{ROLE_LABEL[op.role]}</Text>
              </View>
              <Text style={styles.opName}>{op.name}</Text>
              <Text style={styles.opMeta}>
                {op.role === 'cochero'
                  ? `${op.ordersCount} pedidos`
                  : `${op.ordersCount} entregas · ${op.kmThisWeek.toFixed(1)} km`}
              </Text>
            </View>

            <View style={styles.opRight}>
              {op.isPaid ? (
                <>
                  <Text style={styles.paidAmount}>${op.paidAmount.toFixed(2)}</Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>Pagado ✓</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.pendingAmount}>${op.weekEarnings.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.payBtn}
                    activeOpacity={0.8}
                    onPress={() => setConfirm(op)}
                  >
                    <Text style={styles.payBtnText}>Marcar pagado</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {/* ── Payment history ── */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Historial de pagos</Text>

          {paymentHistory.map(rec => (
            <View key={rec.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <View style={[styles.historyRoleDot, { backgroundColor: ROLE_COLOR[rec.role] }]} />
                <View>
                  <Text style={styles.historyName}>{rec.operatorName}</Text>
                  <Text style={styles.historyMeta}>
                    {ROLE_LABEL[rec.role]} · {rec.weekLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>${rec.amount.toFixed(2)}</Text>
                <Text style={styles.historyDate}>{formatShortDate(rec.paidAt)}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── Confirm modal ── */}
      <Modal
        visible={confirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setConfirm(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Confirmar pago</Text>
            {confirm && (
              <>
                <Text style={styles.modalBody}>
                  Vas a registrar el pago de{'\n'}
                  <Text style={styles.modalName}>{confirm.name}</Text>
                  {'\n'}por la semana actual.
                </Text>
                <View style={styles.modalAmountRow}>
                  <Text style={styles.modalAmountLabel}>Monto a pagar</Text>
                  <Text style={styles.modalAmount}>${confirm.weekEarnings.toFixed(2)}</Text>
                </View>
              </>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setConfirm(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleConfirmPay}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnConfirmText}>Confirmar pago</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F1FB',
  },

  // Header
  header: {
    backgroundColor: '#3D1F8B',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  payDateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  payDateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '800',
  },
  summaryCount: {
    fontSize: 12,
    color: '#777',
  },

  // Filter tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E8E2F8',
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#3D1F8B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D1F8B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Operator card
  opCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  opCardPaid: {
    opacity: 0.7,
  },
  opLeft: {
    flex: 1,
    gap: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  opName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  opMeta: {
    fontSize: 12,
    color: '#777',
  },
  opRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 12,
  },
  pendingAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E67E22',
  },
  payBtn: {
    backgroundColor: '#3D1F8B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paidAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2ECC71',
  },
  paidBadge: {
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidBadgeText: {
    color: '#1A5C2A',
    fontSize: 12,
    fontWeight: '700',
  },

  // History
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF9',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyRoleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  historyMeta: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D1F8B',
  },
  historyDate: {
    fontSize: 11,
    color: '#999',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalName: {
    fontWeight: '700',
    color: '#3D1F8B',
  },
  modalAmountRow: {
    backgroundColor: '#F4F1FB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 2,
  },
  modalAmountLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3D1F8B',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F0EDF9',
  },
  modalBtnCancelText: {
    color: '#3D1F8B',
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    backgroundColor: '#3D1F8B',
  },
  modalBtnConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

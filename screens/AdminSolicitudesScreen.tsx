import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import {
  useAdminSolicitudesStore,
  Solicitud,
  SolicitudRole,
  SolicitudStatus,
  RejectionReason,
  REJECTION_REASONS,
} from '../store/adminSolicitudesStore';

// ─── Paleta admin ─────────────────────────────────────────────────────────────

const C = {
  header:       '#1A237E',
  headerMid:    '#283593',
  accent:       '#3949AB',
  accentFaint:  '#E8EAF6',
  green:        '#2E7D32',
  greenFaint:   '#E8F5E9',
  greenBorder:  '#A5D6A7',
  red:          '#C62828',
  redFaint:     '#FFEBEE',
  redBorder:    '#EF9A9A',
  amber:        '#F57F17',
  amberFaint:   '#FFF8E1',
  amberBorder:  '#FFE082',
  bg:           '#F3F4F8',
  white:        '#FFFFFF',
  text:         '#1A1A1A',
  textMid:      '#4A4A4A',
  textSoft:     '#888',
  border:       '#E0E0E8',
};

// ─── Config por rol ───────────────────────────────────────────────────────────

const ROLE_CFG: Record<SolicitudRole, { label: string; color: string; bg: string }> = {
  cochero:       { label: 'Cochero',       color: '#1A5C2A', bg: '#EAFAF1' },
  transportista: { label: 'Transportista', color: '#5C3D08', bg: '#FFFAE0' },
  comerciante:   { label: 'Comerciante',   color: '#7B1F00', bg: '#FBE9E7' },
};

type FilterTab = 'todos' | SolicitudRole;

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AdminSolicitudes'>;
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AdminSolicitudesScreen({ navigation }: Props) {
  const { solicitudes, aprobar, rechazar } = useAdminSolicitudesStore();

  const [filter,          setFilter]          = useState<FilterTab>('todos');
  const [rejectTarget,    setRejectTarget]    = useState<Solicitud | null>(null);
  const [selectedReason,  setSelectedReason]  = useState<RejectionReason | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const pendientes = solicitudes.filter((s) => s.status === 'pendiente').length;
  const aprobadas  = solicitudes.filter((s) => s.status === 'aprobada').length;
  const rechazadas = solicitudes.filter((s) => s.status === 'rechazada').length;

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const visible = solicitudes.filter((s) =>
    filter === 'todos' ? true : s.role === filter
  );

  // ── Acciones ───────────────────────────────────────────────────────────────
  function handleAprobar(sol: Solicitud) {
    Alert.alert(
      'Aprobar solicitud',
      `¿Aprobar a ${sol.name} como ${ROLE_CFG[sol.role].label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: () => {
            aprobar(sol.id);
            Alert.alert(
              '✓ Notificación enviada',
              `Se notificó a ${sol.name} que su solicitud fue aprobada.`
            );
          },
        },
      ]
    );
  }

  function handleConfirmRechazo() {
    if (!rejectTarget || !selectedReason) return;
    rechazar(rejectTarget.id, selectedReason);
    const name = rejectTarget.name;
    setRejectTarget(null);
    setSelectedReason(null);
    Alert.alert(
      'Solicitud rechazada',
      `Se notificó a ${name} sobre el motivo: "${selectedReason}".`
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.header} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Solicitudes de registro</Text>
          {pendientes > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatChip label="Pendientes" value={pendientes} color={C.amber}  bg={C.amberFaint} />
        <StatChip label="Aprobadas"  value={aprobadas}  color={C.green}  bg={C.greenFaint} />
        <StatChip label="Rechazadas" value={rechazadas} color={C.red}    bg={C.redFaint}   />
      </View>

      {/* ── Filtro por rol ── */}
      <View style={styles.filterRow}>
        {(['todos', 'cochero', 'transportista', 'comerciante'] as FilterTab[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            activeOpacity={0.75}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'todos' ? 'Todos' : ROLE_CFG[f as SolicitudRole].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Lista ── */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={48} color={C.textSoft} />
            <Text style={styles.emptyText}>Sin solicitudes en este filtro</Text>
          </View>
        )}

        {visible.map((sol) => (
          <SolicitudCard
            key={sol.id}
            sol={sol}
            onAprobar={() => handleAprobar(sol)}
            onRechazar={() => { setRejectTarget(sol); setSelectedReason(null); }}
          />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal de rechazo ── */}
      <Modal
        visible={rejectTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Cabecera */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrapper}>
                <Ionicons name="close-circle-outline" size={28} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Rechazar solicitud</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {rejectTarget?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRejectTarget(null)}>
                <Ionicons name="close" size={22} color={C.textSoft} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPrompt}>Selecciona el motivo del rechazo:</Text>

            {/* Opciones */}
            <View style={styles.reasonsList}>
              {REJECTION_REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonItem, active && styles.reasonItemActive]}
                    activeOpacity={0.75}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <View style={[styles.reasonRadio, active && styles.reasonRadioActive]}>
                      {active && <View style={styles.reasonRadioDot} />}
                    </View>
                    <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setRejectTarget(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !selectedReason && styles.modalConfirmBtnDisabled]}
                activeOpacity={selectedReason ? 0.85 : 1}
                onPress={handleConfirmRechazo}
              >
                <Ionicons name="close-circle" size={18} color={C.white} />
                <Text style={styles.modalConfirmText}>Confirmar rechazo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Card de solicitud ────────────────────────────────────────────────────────

function SolicitudCard({
  sol,
  onAprobar,
  onRechazar,
}: {
  sol:        Solicitud;
  onAprobar:  () => void;
  onRechazar: () => void;
}) {
  const cfg       = ROLE_CFG[sol.role];
  const isPending = sol.status === 'pendiente';
  const isApproved= sol.status === 'aprobada';

  const statusColor =
    isPending  ? C.amber  :
    isApproved ? C.green  : C.red;

  const statusLabel =
    isPending  ? 'Pendiente'  :
    isApproved ? 'Aprobada'   : 'Rechazada';

  const statusIcon: keyof typeof Ionicons.glyphMap =
    isPending  ? 'time-outline'       :
    isApproved ? 'checkmark-circle'   : 'close-circle';

  return (
    <View style={[
      styles.card,
      isApproved && styles.cardApproved,
      sol.status === 'rechazada' && styles.cardRejected,
    ]}>
      {/* Fila superior */}
      <View style={styles.cardTop}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: cfg.bg }]}>
          <Ionicons name={roleIcon(sol.role)} size={24} color={cfg.color} />
        </View>

        {/* Nombre + rol + fecha */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{sol.name}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.roleBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
              <Text style={[styles.roleText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '50' }]}>
              <Ionicons name={statusIcon} size={11} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={C.textSoft} />
            <Text style={styles.dateText}>{formatDate(sol.requestedAt)}</Text>
            <Ionicons name="call-outline" size={12} color={C.textSoft} style={{ marginLeft: 8 }} />
            <Text style={styles.dateText}>{sol.phone}</Text>
          </View>
        </View>
      </View>

      {/* Documentos */}
      <View style={styles.docsRow}>
        <Ionicons name="documents-outline" size={14} color={C.accent} />
        <Text style={styles.docsLabel}>Documentos:</Text>
        <View style={styles.docsList}>
          {sol.documents.map((doc, i) => (
            <View key={i} style={styles.docChip}>
              <Ionicons name="document-attach-outline" size={12} color={C.accent} />
              <Text style={styles.docChipText}>{doc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Motivo de rechazo */}
      {sol.status === 'rechazada' && sol.rejectionReason && (
        <View style={styles.rejectionRow}>
          <Ionicons name="alert-circle-outline" size={14} color={C.red} />
          <Text style={styles.rejectionText}>Motivo: {sol.rejectionReason}</Text>
        </View>
      )}

      {/* Botones — solo si pendiente */}
      {isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectBtn} activeOpacity={0.85} onPress={onRechazar}>
            <Ionicons name="close-circle-outline" size={18} color={C.red} />
            <Text style={styles.rejectBtnText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} activeOpacity={0.85} onPress={onAprobar}>
            <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
            <Text style={styles.approveBtnText}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleIcon(role: SolicitudRole): keyof typeof Ionicons.glyphMap {
  switch (role) {
    case 'cochero':       return 'bicycle-outline';
    case 'transportista': return 'car-outline';
    case 'comerciante':   return 'storefront-outline';
  }
}

function formatDate(d: Date): string {
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh}:${mm}`;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.header },

  // Header
  header: {
    backgroundColor: C.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: C.white },
  headerBadge: {
    backgroundColor: C.amber, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: C.white },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.header,
  },
  statChip: {
    flex: 1, borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', gap: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  // Filtro
  filterRow: {
    flexDirection: 'row',
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterTab: {
    flex: 1, alignItems: 'center', paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.bg,
  },
  filterTabActive: {
    backgroundColor: C.accentFaint, borderColor: C.accent,
  },
  filterTabText: { fontSize: 12, fontWeight: '600', color: C.textSoft },
  filterTabTextActive: { color: C.accent },

  // Lista
  list: {
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 12,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: 15, color: C.textSoft, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: C.white, borderRadius: 18,
    padding: 16, gap: 12,
    borderWidth: 1.5, borderColor: C.border,
    shadowColor: C.header, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardApproved: { borderColor: C.greenBorder, backgroundColor: '#FAFFFE' },
  cardRejected: { borderColor: C.redBorder,   backgroundColor: '#FFFAFA' },

  cardTop: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.border,
  },
  avatarEmoji: { fontSize: 24 },

  cardInfo:  { flex: 1, gap: 5 },
  cardName:  { fontSize: 16, fontWeight: '800', color: C.text },
  cardMeta:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  roleBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  roleText:   { fontSize: 11, fontWeight: '700' },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: C.textSoft },

  // Documentos
  docsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: C.accentFaint, borderRadius: 10, padding: 10,
  },
  docsLabel: { fontSize: 12, color: C.accent, fontWeight: '600', marginTop: 1 },
  docsList:  { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  docChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.white, borderRadius: 8, borderWidth: 1,
    borderColor: C.accent + '40', paddingHorizontal: 8, paddingVertical: 4,
  },
  docChipText: { fontSize: 11, color: C.accent, fontWeight: '600' },

  // Rechazo
  rejectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.redFaint, borderRadius: 10, padding: 10,
  },
  rejectionText: { fontSize: 13, color: C.red, fontWeight: '600', flex: 1 },

  // Botones de acción
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1.5, borderColor: C.red,
    borderRadius: 12, paddingVertical: 12,
    backgroundColor: C.redFaint,
  },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: C.red },

  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: C.green, borderRadius: 12, paddingVertical: 12,
    shadowColor: C.green, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: C.white },

  // Modal rechazo
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(10,10,30,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, gap: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  modalIconWrapper: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.redFaint, alignItems: 'center', justifyContent: 'center',
  },
  modalTitle:  { fontSize: 17, fontWeight: '800', color: C.text },
  modalSub:    { fontSize: 13, color: C.textSoft, marginTop: 1 },
  modalPrompt: { fontSize: 14, color: C.textMid, fontWeight: '600' },

  reasonsList: { gap: 8 },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13,
  },
  reasonItemActive: {
    borderColor: C.red, backgroundColor: C.redFaint,
  },
  reasonRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  reasonRadioActive: { borderColor: C.red },
  reasonRadioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: C.red,
  },
  reasonText:       { fontSize: 14, color: C.textMid, fontWeight: '500', flex: 1 },
  reasonTextActive: { color: C.red, fontWeight: '700' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: C.textSoft },

  modalConfirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.red, borderRadius: 14, paddingVertical: 14,
  },
  modalConfirmBtnDisabled: {
    backgroundColor: '#EF9A9A',
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: C.white },
});

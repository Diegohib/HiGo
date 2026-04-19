import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useCocheroTicketStore, Ticket, TicketProduct } from '../store/cocheroTicketStore';
import { useCocheroStore } from '../store/cocheroStore';
import { useAuthStore } from '../store/authStore';
import { EARNING_TIERS, nextPayFriday, formatShortDate } from '../utils/earnings';

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  header:      '#2D7A3A',
  headerDark:  '#1A5C2A',
  green:       '#2ECC71',
  greenDark:   '#27AE60',
  greenFaint:  '#EAFAF1',
  greenLight:  '#D5F0E0',
  orange:      '#E67E22',
  orangeFaint: '#FEF0E0',
  yellow:      '#F9A825',
  yellowFaint: '#FFFDE7',
  bg:          '#F0FFF4',
  white:       '#FFFFFF',
  text:        '#1A1A1A',
  textMid:     '#4A4A4A',
  textSoft:    '#888',
  border:      '#D5F0E0',
  tabActive:   '#2D7A3A',
  tabInactive: '#9B9B9B',
};

type Tab = 'tickets' | 'ganancias' | 'perfil';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CocheroDashboard'>;
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CocheroDashboardScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('tickets');

  const { tickets, disponible, toggleDisponible, iniciarRecogida, consolidarTodos } =
    useCocheroTicketStore();

  const hasPendiente    = tickets.some((t) => t.status === 'pendiente');
  const hasEnMercado    = tickets.some((t) => t.status === 'en_mercado');
  const allDone         = tickets.every((t) => t.status === 'consolidado');
  const showConsolidar  = hasEnMercado && !hasPendiente;

  const totalHoy        = tickets.reduce((s, t) => s + t.earning, 0);
  const totalPedidos    = tickets.length;

  function handleConsolidar() {
    Alert.alert(
      'Confirmar consolidación',
      '¿Terminaste de recoger todos los productos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, consolidar', onPress: () => consolidarTodos() },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerDark} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="bicycle" size={22} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerName}>Carlos Pérez</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.disponibleBadge, !disponible && styles.noDisponibleBadge]}
          activeOpacity={0.8}
          onPress={toggleDisponible}
        >
          <View style={[styles.disponibleDot, !disponible && styles.noDisponibleDot]} />
          <Text style={[styles.disponibleText, !disponible && styles.noDisponibleText]}>
            {disponible ? 'Disponible' : 'No disponible'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Contenido por tab ── */}
      <View style={styles.body}>
        {activeTab === 'tickets' && (
          <TicketsTab
            tickets={tickets}
            totalHoy={totalHoy}
            totalPedidos={totalPedidos}
            showConsolidar={showConsolidar}
            allDone={allDone}
            onIniciar={iniciarRecogida}
            onConsolidar={handleConsolidar}
          />
        )}
        {activeTab === 'ganancias' && <GananciasTab />}
        {activeTab === 'perfil'    && <PerfilTab onLogout={() => {
          useAuthStore.getState().logout();
          navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
        }} />}
      </View>

      {/* ── Bottom tab bar ── */}
      <View style={styles.tabBar}>
        <TabBarItem
          icon="ticket-outline"
          label="Tickets"
          active={activeTab === 'tickets'}
          badge={hasPendiente ? tickets.filter((t) => t.status === 'pendiente').length : 0}
          onPress={() => setActiveTab('tickets')}
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
    </SafeAreaView>
  );
}

// ─── Tab: Tickets ─────────────────────────────────────────────────────────────

function TicketsTab({
  tickets,
  totalHoy,
  totalPedidos,
  showConsolidar,
  allDone,
  onIniciar,
  onConsolidar,
}: {
  tickets:        Ticket[];
  totalHoy:       number;
  totalPedidos:   number;
  showConsolidar: boolean;
  allDone:        boolean;
  onIniciar:      (id: string) => void;
  onConsolidar:   () => void;
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumen rápido */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="list-outline" size={22} color={C.greenDark} />
          <Text style={styles.summaryValue}>{totalPedidos}</Text>
          <Text style={styles.summaryLabel}>Tickets hoy</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardGreen, { flex: 1 }]}>
          <Ionicons name="cash-outline" size={22} color={C.white} />
          <Text style={[styles.summaryValue, { color: C.white }]}>${totalHoy.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Ganancia hoy</Text>
        </View>
      </View>

      {/* Lista de tickets */}
      <Text style={styles.sectionTitle}>Tickets del día</Text>

      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onIniciar={() => onIniciar(ticket.id)}
        />
      ))}

      {/* Botón consolidar */}
      {showConsolidar && (
        <TouchableOpacity style={styles.consolidarBtn} activeOpacity={0.85} onPress={onConsolidar}>
          <Ionicons name="cube" size={22} color={C.white} />
          <Text style={styles.consolidarBtnText}>Marcar entrega consolidada</Text>
        </TouchableOpacity>
      )}

      {allDone && (
        <View style={styles.allDoneBanner}>
          <Ionicons name="checkmark-circle" size={24} color={C.greenDark} />
          <Text style={styles.allDoneText}>Todos los pedidos consolidados</Text>
        </View>
      )}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ─── Card de ticket individual ────────────────────────────────────────────────

function TicketCard({ ticket, onIniciar }: { ticket: Ticket; onIniciar: () => void }) {
  const isPendiente    = ticket.status === 'pendiente';
  const isEnMercado    = ticket.status === 'en_mercado';
  const isConsolidado  = ticket.status === 'consolidado';

  const statusColor =
    isPendiente   ? C.textSoft  :
    isEnMercado   ? C.orange    : C.greenDark;

  const statusLabel =
    isPendiente   ? 'Pendiente'   :
    isEnMercado   ? 'En mercado'  : 'Consolidado';

  const statusIcon: 'time-outline' | 'cart' | 'checkmark-circle' =
    isPendiente   ? 'time-outline' :
    isEnMercado   ? 'cart'         : 'checkmark-circle';

  return (
    <View style={[
      styles.ticketCard,
      isEnMercado   && styles.ticketCardOrange,
      isConsolidado && styles.ticketCardGreen,
    ]}>
      {/* Cabecera del ticket */}
      <View style={styles.ticketHeader}>
        <View style={styles.ticketHeaderLeft}>
          <Text style={styles.ticketId}>Pedido #{ticket.id}</Text>
          <View style={styles.timeSlotPill}>
            <Ionicons name="time-outline" size={12} color={C.textSoft} />
            <Text style={styles.timeSlotText}>{ticket.timeSlot}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '1A', borderColor: statusColor }]}>
          <Ionicons name={statusIcon} size={13} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Cliente */}
      <View style={styles.clientRow}>
        <Ionicons name="person-outline" size={14} color={C.textSoft} />
        <Text style={styles.clientName}>{ticket.clientName}</Text>
      </View>

      {/* Separador */}
      <View style={styles.ticketDivider} />

      {/* Productos */}
      <Text style={styles.productsTitle}>Productos a recoger</Text>
      {ticket.products.map((p, i) => (
        <ProductRow key={i} product={p} />
      ))}

      {/* Separador */}
      <View style={styles.ticketDivider} />

      {/* Ganancia (sin mostrar monto del pedido al cochero) */}
      <View style={styles.earningRow}>
        <Ionicons name="cash-outline" size={16} color={C.greenDark} />
        <Text style={styles.earningLabel}>Tu ganancia por este pedido</Text>
        <Text style={styles.earningAmount}>+${ticket.earning.toFixed(2)}</Text>
      </View>

      {/* Botón acción */}
      {isPendiente && (
        <TouchableOpacity style={styles.iniciarBtn} activeOpacity={0.85} onPress={onIniciar}>
          <Ionicons name="cart-outline" size={18} color={C.white} />
          <Text style={styles.iniciarBtnText}>Iniciar recogida</Text>
        </TouchableOpacity>
      )}

      {isEnMercado && (
        <View style={styles.enMercadoBanner}>
          <Ionicons name="walk-outline" size={16} color={C.orange} />
          <Text style={styles.enMercadoText}>Recogida en progreso...</Text>
        </View>
      )}

      {isConsolidado && (
        <View style={styles.consolidadoBanner}>
          <Ionicons name="checkmark-circle-outline" size={16} color={C.greenDark} />
          <Text style={styles.consolidadoText}>Recogida completada</Text>
        </View>
      )}
    </View>
  );
}

function ProductRow({ product }: { product: TicketProduct }) {
  return (
    <View style={styles.productRow}>
      <Text style={styles.productEmoji}>{product.emoji}</Text>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productStall}>{product.stall}</Text>
      </View>
      <View style={styles.productQtyBadge}>
        <Text style={styles.productQty}>{product.qty}</Text>
      </View>
    </View>
  );
}

// ─── Tab: Ganancias ───────────────────────────────────────────────────────────

function GananciasTab() {
  const { weeklyEarnings, todayEarnings, todayOrdersCount, totalOrdersCount, weekRecords } =
    useCocheroStore();

  const payFriday = nextPayFriday();
  const WEEKLY_TARGET = 60;
  const pct = Math.min(weeklyEarnings / WEEKLY_TARGET, 1);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Saldo semanal */}
      <View style={styles.weekCard}>
        <Text style={styles.weekCardLabel}>Saldo acumulado esta semana</Text>
        <Text style={styles.weekCardAmount}>${weeklyEarnings.toFixed(2)}</Text>
        <View style={styles.payRow}>
          <Ionicons name="calendar-outline" size={14} color={C.greenDark} />
          <Text style={styles.payText}>Próximo pago: {formatShortDate(payFriday)}</Text>
        </View>
        {/* Barra de progreso */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round(pct * 100)}% del objetivo semanal (${WEEKLY_TARGET})
        </Text>
      </View>

      {/* Hoy */}
      <Text style={styles.sectionTitle}>Hoy</Text>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="bicycle-outline" size={22} color={C.greenDark} />
          <Text style={styles.summaryValue}>{todayOrdersCount}</Text>
          <Text style={styles.summaryLabel}>Pedidos hoy</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardGreen, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={22} color={C.white} />
          <Text style={[styles.summaryValue, { color: C.white }]}>${todayEarnings.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Ganancia hoy</Text>
        </View>
      </View>

      {/* Tarifas */}
      <Text style={styles.sectionTitle}>Tarifas por pedido</Text>
      <View style={styles.tiersCard}>
        {EARNING_TIERS.map((tier, idx) => (
          <View
            key={idx}
            style={[styles.tierRow, idx < EARNING_TIERS.length - 1 && styles.tierRowBorder]}
          >
            <View style={styles.tierRange}>
              <Ionicons name="pricetag-outline" size={14} color={C.greenDark} />
              <Text style={styles.tierLabel}>{tier.label}</Text>
            </View>
            <View style={styles.tierEarningBadge}>
              <Text style={styles.tierEarningText}>+${tier.earning.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

function PerfilTab({ onLogout }: { onLogout: () => void }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.perfilAvatarWrapper}>
        <View style={styles.perfilAvatar}>
          <Ionicons name="bicycle" size={38} color={C.greenDark} />
        </View>
        <Text style={styles.perfilName}>Carlos Pérez</Text>
        <View style={styles.perfilRolePill}>
          <Text style={styles.perfilRoleText}>Cochero</Text>
        </View>
      </View>

      {/* Datos */}
      <View style={styles.perfilCard}>
        <PerfilRow icon="call-outline"      label="Teléfono"  value="+593 99 123 4567" />
        <View style={styles.ticketDivider} />
        <PerfilRow icon="card-outline"      label="Cédula"    value="17XXXXXXXX" />
        <View style={styles.ticketDivider} />
        <PerfilRow icon="bicycle-outline"   label="Coche No." value="042" />
        <View style={styles.ticketDivider} />
        <PerfilRow icon="shield-checkmark-outline" label="Estado" value="Verificado" valueColor={C.greenDark} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#E74C3C" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function PerfilRow({
  icon, label, value, valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.perfilRow}>
      <View style={styles.perfilRowIcon}>
        <Ionicons name={icon} size={18} color={C.greenDark} />
      </View>
      <Text style={styles.perfilRowLabel}>{label}</Text>
      <Text style={[styles.perfilRowValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

function TabBarItem({
  icon, label, active, badge = 0, onPress,
}: {
  icon:    keyof typeof Ionicons.glyphMap;
  label:   string;
  active:  boolean;
  badge?:  number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.tabIconWrapper}>
        <Ionicons
          name={active ? (icon.replace('-outline', '') as any) : icon}
          size={24}
          color={active ? C.tabActive : C.tabInactive}
        />
        {badge > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.headerDark },

  // ── Header
  header: {
    backgroundColor: C.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  headerGreeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: C.white,
  },
  disponibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  noDisponibleBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  disponibleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  noDisponibleDot: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  disponibleText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.green,
  },
  noDisponibleText: {
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Body
  body: { flex: 1, backgroundColor: C.bg },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  // ── Resumen
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.header,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardGreen: {
    backgroundColor: C.green,
    borderColor: C.greenDark,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: C.textSoft,
    fontWeight: '600',
  },

  // ── Ticket card
  ticketCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.header,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketCardOrange: {
    borderColor: C.orange,
    backgroundColor: '#FFFBF5',
  },
  ticketCardGreen: {
    borderColor: C.greenDark,
    backgroundColor: C.greenFaint,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ticketHeaderLeft: { gap: 4 },
  ticketId: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  timeSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeSlotText: {
    fontSize: 12,
    color: C.textSoft,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: '500',
  },

  ticketDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  productsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Fila de producto
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  productEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: C.text },
  productStall: { fontSize: 12, color: C.textSoft, marginTop: 1 },
  productQtyBadge: {
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productQty: { fontSize: 12, fontWeight: '700', color: '#3D1F8B' },

  // ── Ganancia del ticket
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.greenFaint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  earningLabel: {
    flex: 1,
    fontSize: 13,
    color: C.greenDark,
    fontWeight: '600',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: C.greenDark,
  },

  // ── Botones de acción en ticket
  iniciarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.header,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 2,
  },
  iniciarBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },
  enMercadoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.orangeFaint,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 2,
  },
  enMercadoText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.orange,
  },
  consolidadoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.greenFaint,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 2,
  },
  consolidadoText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.greenDark,
  },

  // ── Botón consolidar
  consolidarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1565C0',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  consolidarBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
  },

  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.greenFaint,
    borderWidth: 1.5,
    borderColor: C.greenDark,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  allDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.greenDark,
  },

  // ── Ganancias tab
  weekCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 6,
    shadowColor: C.greenDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weekCardLabel: { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  weekCardAmount: { fontSize: 44, fontWeight: '800', color: C.green, letterSpacing: -1 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payText: { fontSize: 13, color: C.greenDark, fontWeight: '600' },
  progressTrack: {
    height: 7,
    backgroundColor: C.greenFaint,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 4,
  },
  progressLabel: { fontSize: 11, color: C.textSoft },

  tiersCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
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
  tierRange: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tierLabel: { fontSize: 14, color: C.textMid, fontWeight: '600' },
  tierEarningBadge: {
    backgroundColor: C.greenFaint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierEarningText: { fontSize: 15, fontWeight: '800', color: C.greenDark },

  // ── Perfil tab
  perfilAvatarWrapper: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  perfilAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.greenFaint,
    borderWidth: 3,
    borderColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilAvatarEmoji: { fontSize: 38 },
  perfilName: { fontSize: 22, fontWeight: '800', color: C.text },
  perfilRolePill: {
    backgroundColor: C.greenFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.greenLight,
  },
  perfilRoleText: { fontSize: 13, fontWeight: '700', color: C.greenDark },

  perfilCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: C.header,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  perfilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  perfilRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.greenFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilRowLabel: { flex: 1, fontSize: 14, color: C.textSoft },
  perfilRowValue: { fontSize: 14, fontWeight: '700', color: C.text },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FADADD',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FFF5F5',
    marginTop: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E74C3C' },

  // ── Bottom tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 4,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  tabIconWrapper: { position: 'relative' },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  tabLabel: { fontSize: 11, fontWeight: '600', color: C.tabInactive },
  tabLabelActive: { color: C.tabActive },
});

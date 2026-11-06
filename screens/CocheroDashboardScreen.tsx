import {
  useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useCocheroTicketStore, Ticket } from '../store/cocheroTicketStore';
import { useCocheroStore } from '../store/cocheroStore';
import { useAuthStore } from '../store/authStore';
import { useProductsStore } from '../store/productsStore';
import { CartItem } from '../store/cartStore';
import { useThemeColors } from '../theme/useThemeColors';
import { cardShadow, floatingShadow } from '../theme/elevation';
import { pickAvatarPhoto } from '../lib/pickAvatarPhoto';
import Avatar from '../components/Avatar';
import StaffHeader, { STAFF_HEADER_TOP } from '../components/StaffHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shortName } from '../utils/name';
import StallPickupList from '../components/StallPickupList';
import { useOrderStallTickets } from '../store/stallTicketsStore';
import AppearanceSelector from '../components/AppearanceSelector';
import { EARNING_TIERS, calcEarning, nextPayFriday, formatShortDate } from '../utils/earnings';

// ─── Paleta ───────────────────────────────────────────────────────────────────
// El morado de marca de la app es el color de este dashboard (fijo en ambos
// temas, igual que en Transportista y Comerciante); los fondos/superficies/
// texto sí se adaptan según el tema activo.

function useScreenColors() {
  const T = useThemeColors();
  return {
    header:      '#5B2BD9',
    headerDark:  '#3D1F8B',
    headerFaint: T.primaryFaint,
    green:       '#2ECC71',
    greenDark:   '#27AE60',
    greenFaint:  T.successFaint,
    greenLight:  T.border,
    orange:      '#E67E22',
    orangeFaint: T.warningFaint,
    yellow:      '#F9A825',
    yellowFaint: T.warningFaint,
    bg:          T.background,
    white:       T.surface,
    text:        T.text,
    textMid:     T.textSoft,
    textSoft:    T.textFaint,
    border:      T.border,
    tabActive:   '#5B2BD9',
    tabInactive: T.textFaint,
  };
}
type ScreenColors = ReturnType<typeof useScreenColors>;

type Tab = 'tickets' | 'ganancias' | 'perfil';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CocheroDashboard'>;
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CocheroDashboardScreen({ navigation }: Props) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const [activeTab, setActiveTab] = useState<Tab>('tickets');
  // "Disponible" queda como estado local por ahora — no filtra el pool de
  // pedidos disponibles todavía, es solo el indicador visual que ya existía.
  const [disponible, setDisponible] = useState(true);

  const { disponibles, mios, reclamar, marcarConsolidado } = useCocheroTicketStore();

  const user = useAuthStore((s) => s.user);

  const allDone = mios.length > 0 && mios.every((t) => t.status === 'consolidado');

  const totalHoy        = mios.reduce((s, t) => s + calcEarning(t.productSubtotal), 0);
  const totalPedidos    = mios.length;

  function handleConsolidar(ticketId: string) {
    Alert.alert(
      'Confirmar consolidación',
      '¿Terminaste de recoger todos los productos de este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, consolidar', onPress: () => marcarConsolidado(ticketId) },
      ]
    );
  }

  function handleChat(ticketId: string) {
    navigation.navigate('OrderChat', { orderId: ticketId });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={STAFF_HEADER_TOP} />

      {/* ── Header ── */}
      <StaffHeader
        name={user ? shortName(user) : 'Cochero'}
        photoUri={user?.photoUri}
        roleLabel="Cochero"
        available={disponible}
        onToggleAvailable={() => setDisponible((v) => !v)}
      />

      {/* ── Contenido por tab ── */}
      <View style={styles.body}>
        {activeTab === 'tickets' && (
          <TicketsTab
            disponibles={disponibles}
            mios={mios}
            totalHoy={totalHoy}
            totalPedidos={totalPedidos}
            allDone={allDone}
            onReclamar={reclamar}
            onConsolidar={handleConsolidar}
            onChat={handleChat}
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
          badge={disponibles.length}
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
  disponibles,
  mios,
  totalHoy,
  totalPedidos,
  allDone,
  onReclamar,
  onConsolidar,
  onChat,
}: {
  disponibles:  Ticket[];
  mios:         Ticket[];
  totalHoy:     number;
  totalPedidos: number;
  allDone:      boolean;
  onReclamar:   (id: string) => void;
  onConsolidar: (id: string) => void;
  onChat:       (id: string) => void;
}) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumen rápido */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="list-outline" size={22} color={C.header} />
          <Text style={styles.summaryValue}>{totalPedidos}</Text>
          <Text style={styles.summaryLabel}>Mis pedidos</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardGreen, { flex: 1 }]}>
          <Ionicons name="cash-outline" size={22} color={C.white} />
          <Text style={[styles.summaryValue, { color: C.white }]}>${totalHoy.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Ganancia hoy</Text>
        </View>
      </View>

      {/* Disponibles */}
      <Text style={styles.sectionTitle}>Disponibles ({disponibles.length})</Text>
      {disponibles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={40} color={C.textSoft} />
          <Text style={styles.emptyStateText}>No hay pedidos disponibles por ahora</Text>
        </View>
      ) : (
        disponibles.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onReclamar={() => onReclamar(ticket.id)} />
        ))
      )}

      {/* Mis pedidos */}
      <Text style={styles.sectionTitle}>Mis pedidos</Text>
      {mios.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={40} color={C.textSoft} />
          <Text style={styles.emptyStateText}>Todavía no reclamaste ningún pedido</Text>
        </View>
      ) : (
        mios.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onConsolidar={() => onConsolidar(ticket.id)}
            onChat={() => onChat(ticket.id)}
          />
        ))
      )}

      {allDone && (
        <View style={styles.allDoneBanner}>
          <Ionicons name="checkmark-circle" size={24} color={C.greenDark} />
          <Text style={styles.allDoneText}>Todos tus pedidos están consolidados</Text>
        </View>
      )}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ─── Card de ticket individual ────────────────────────────────────────────────

function TicketCard({
  ticket, onReclamar, onConsolidar, onChat,
}: {
  ticket:        Ticket;
  onReclamar?:   () => void;
  onConsolidar?: () => void;
  onChat?:       () => void;
}) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const isDisponible  = ticket.status === 'recibido';
  const isEnMercado   = ticket.status === 'en_mercado';
  const isConsolidado = ticket.status === 'consolidado';
  // Pedidos con tickets por puesto se consolidan solos al retirar el último;
  // el botón manual queda solo para pedidos viejos.
  const { tickets: stallTickets, loaded: stallLoaded } = useOrderStallTickets(ticket.id);
  const hasStallTickets = !stallLoaded || stallTickets.length > 0;

  const statusColor =
    isDisponible ? C.textSoft :
    isEnMercado  ? C.orange   : C.greenDark;

  const statusLabel =
    isDisponible ? 'Disponible'  :
    isEnMercado  ? 'En mercado'  : 'Consolidado';

  const statusIcon: 'time-outline' | 'cart' | 'checkmark-circle' =
    isDisponible ? 'time-outline' :
    isEnMercado  ? 'cart'         : 'checkmark-circle';

  const earning = calcEarning(ticket.productSubtotal);

  return (
    <View style={[
      styles.ticketCard,
      isEnMercado   && styles.ticketCardOrange,
      isConsolidado && styles.ticketCardGreen,
    ]}>
      {/* Cabecera del ticket */}
      <View style={styles.ticketHeader}>
        <View style={styles.ticketHeaderLeft}>
          <Text style={styles.ticketId}>Pedido #{ticket.id.slice(0, 6)}</Text>
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

      {/* Dirección de entrega */}
      <View style={styles.clientRow}>
        <Ionicons name="location-outline" size={14} color={C.textSoft} />
        <Text style={styles.clientName} numberOfLines={1}>{ticket.address}</Text>
      </View>

      {/* Separador */}
      <View style={styles.ticketDivider} />

      {/* Productos: mientras está en el mercado, agrupados por puesto */}
      {isEnMercado ? (
        <StallPickupList
          orderId={ticket.id}
          canPick
          renderEmpty={() => (
            <>
              <Text style={styles.productsTitle}>Productos a recoger</Text>
              {ticket.items.map((item, i) => <ProductRow key={i} item={item} />)}
            </>
          )}
        />
      ) : (
        <>
          <Text style={styles.productsTitle}>Productos a recoger</Text>
          {ticket.items.map((item, i) => (
            <ProductRow key={i} item={item} />
          ))}
        </>
      )}

      {/* Separador */}
      <View style={styles.ticketDivider} />

      {/* Ganancia (sin mostrar monto del pedido al cochero) */}
      <View style={styles.earningRow}>
        <Ionicons name="cash-outline" size={16} color={C.header} />
        <Text style={styles.earningLabel}>Tu ganancia por este pedido</Text>
        <Text style={styles.earningAmount}>+${earning.toFixed(2)}</Text>
      </View>

      {/* Botón acción */}
      {isDisponible && onReclamar && (
        <TouchableOpacity style={styles.iniciarBtn} activeOpacity={0.85} onPress={onReclamar}>
          <Ionicons name="cart-outline" size={18} color={C.white} />
          <Text style={styles.iniciarBtnText}>Reclamar pedido</Text>
        </TouchableOpacity>
      )}

      {isEnMercado && (
        <View style={styles.actionRow}>
          {onConsolidar && !hasStallTickets && (
            <TouchableOpacity style={[styles.consolidarBtn, { flex: 1 }]} activeOpacity={0.85} onPress={onConsolidar}>
              <Ionicons name="cube" size={20} color={C.white} />
              <Text style={styles.consolidarBtnText}>Marcar consolidado</Text>
            </TouchableOpacity>
          )}
          {onChat && (
            <TouchableOpacity style={styles.chatBtn} activeOpacity={0.85} onPress={onChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.header} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {isConsolidado && (
        <View style={styles.actionRow}>
          <View style={[styles.consolidadoBanner, { flex: 1 }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={C.greenDark} />
            <Text style={styles.consolidadoText}>Recogida completada</Text>
          </View>
          {onChat && (
            <TouchableOpacity style={styles.chatBtn} activeOpacity={0.85} onPress={onChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.header} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function ProductRow({ item }: { item: CartItem }) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const product = useProductsStore((s) => s.products.find((p) => p.id === item.productId));
  return (
    <View style={styles.productRow}>
      <Text style={styles.productEmoji}>{product?.emoji ?? '🛒'}</Text>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product?.name ?? 'Producto'}</Text>
      </View>
      <View style={styles.productQtyBadge}>
        <Text style={styles.productQty}>{item.quantity} {item.presentationLabel}</Text>
      </View>
    </View>
  );
}

// ─── Tab: Ganancias ───────────────────────────────────────────────────────────

function GananciasTab() {
  const C = useScreenColors();
  const styles = makeStyles(C);
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
          <Ionicons name="calendar-outline" size={14} color={C.header} />
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
          <Ionicons name="bicycle-outline" size={22} color={C.header} />
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
      <Text style={styles.sectionTitle}>Tarifas por pedido (según el valor de los productos)</Text>
      <View style={styles.tiersCard}>
        {EARNING_TIERS.map((tier, idx) => (
          <View
            key={idx}
            style={[styles.tierRow, idx < EARNING_TIERS.length - 1 && styles.tierRowBorder]}
          >
            <View style={styles.tierRange}>
              <Ionicons name="pricetag-outline" size={14} color={C.header} />
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
  const C = useScreenColors();
  const styles = makeStyles(C);
  const user = useAuthStore((s) => s.user);
  const updatePhoto = useAuthStore((s) => s.updatePhoto);
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.perfilAvatarWrapper}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => pickAvatarPhoto(updatePhoto)}>
          <View style={{ position: 'relative' }}>
            <Avatar name={user?.name ?? 'Cochero'} photoUri={user?.photoUri} size={80} bg={C.headerFaint} textColor={C.header} />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={C.white} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.perfilName}>{user?.name ?? 'Cochero'}</Text>
        <View style={styles.perfilRolePill}>
          <Text style={styles.perfilRoleText}>Cochero</Text>
        </View>
      </View>

      {/* Datos */}
      <View style={styles.perfilCard}>
        <PerfilRow icon="call-outline"      label="Teléfono"  value={user?.phone ?? '—'} />
        <View style={styles.ticketDivider} />
        <PerfilRow icon="card-outline"      label="Cédula"    value={user?.cedula ?? '—'} />
        <View style={styles.ticketDivider} />
        <PerfilRow icon="bicycle-outline"   label="Coche No." value={user?.numCoche ?? 'Sin asignar'} />
        <View style={styles.ticketDivider} />
        <PerfilRow icon="shield-checkmark-outline" label="Estado" value="Verificado" valueColor={C.greenDark} />
      </View>

      {/* Apariencia */}
      <Text style={styles.sectionTitle}>Apariencia</Text>
      <AppearanceSelector accentColor={C.header} />

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
  const C = useScreenColors();
  const styles = makeStyles(C);
  return (
    <View style={styles.perfilRow}>
      <View style={styles.perfilRowIcon}>
        <Ionicons name={icon} size={18} color={C.header} />
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
  const C = useScreenColors();
  const styles = makeStyles(C);
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

const makeStyles = (C: ScreenColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

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
    ...cardShadow(C, C.header),
  },
  summaryCardGreen: {
    backgroundColor: C.header,
    borderColor: C.header,
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
    ...cardShadow(C, C.header),
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
  productQtyBadge: {
    backgroundColor: C.headerFaint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productQty: { fontSize: 12, fontWeight: '700', color: C.header },

  // ── Ganancia del ticket
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.headerFaint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  earningLabel: {
    flex: 1,
    fontSize: 13,
    color: C.header,
    fontWeight: '600',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: C.header,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 2,
  },
  chatBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.headerFaint,
    borderRadius: 12,
  },
  consolidadoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.greenFaint,
    borderRadius: 10,
    paddingVertical: 10,
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
    backgroundColor: C.header,
    borderRadius: 12,
    paddingVertical: 13,
  },
  consolidarBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },

  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.headerFaint,
    borderWidth: 1.5,
    borderColor: C.header,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  allDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.header,
  },

  // ── Ganancias tab
  weekCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 6,
    ...cardShadow(C, C.header),
  },
  weekCardLabel: { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  weekCardAmount: { fontSize: 44, fontWeight: '800', color: C.header, letterSpacing: -1 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payText: { fontSize: 13, color: C.header, fontWeight: '600' },
  progressTrack: {
    height: 7,
    backgroundColor: C.headerFaint,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.header,
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
    borderBottomColor: C.headerFaint,
  },
  tierRange: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tierLabel: { fontSize: 14, color: C.textMid, fontWeight: '600' },
  tierEarningBadge: {
    backgroundColor: C.headerFaint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierEarningText: { fontSize: 15, fontWeight: '800', color: C.header },

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
    backgroundColor: C.headerFaint,
    borderWidth: 3,
    borderColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilAvatarEmoji: { fontSize: 38 },
  avatarEditBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.header, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  perfilName: { fontSize: 22, fontWeight: '800', color: C.text },
  perfilRolePill: {
    backgroundColor: C.headerFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.greenLight,
  },
  perfilRoleText: { fontSize: 13, fontWeight: '700', color: C.header },

  perfilCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow(C, C.header),
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
    backgroundColor: C.headerFaint,
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

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSoft,
  },

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

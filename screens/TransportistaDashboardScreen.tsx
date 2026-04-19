import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, UrlTile, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import {
  useTransportistaDeliveryStore,
  Delivery,
  DeliveryStatus,
  WAREHOUSE_LAT,
  WAREHOUSE_LNG,
} from '../store/transportistaDeliveryStore';
import { useTransportistaStore } from '../store/transportistaStore';
import { useAuthStore } from '../store/authStore';
import {
  TRANSPORTISTA_BASE,
  TRANSPORTISTA_PER_KM,
  nextPayFriday,
  formatShortDate,
} from '../utils/earnings';

// ─── Paleta ───────────────────────────────────────────────────────────────────

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
  blue:         '#1565C0',
  blueFaint:    '#E3F2FD',
  orange:       '#E67E22',
  orangeFaint:  '#FEF0E0',
  bg:           '#FFFBF0',
  white:        '#FFFFFF',
  text:         '#1A1A1A',
  textMid:      '#4A4A4A',
  textSoft:     '#888',
  tabActive:    '#8B6914',
  tabInactive:  '#9B9B9B',
};

type Tab = 'entregas' | 'ganancias' | 'perfil';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'TransportistaDashboard'>;
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function TransportistaDashboardScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('entregas');

  const {
    deliveries,
    disponible,
    toggleDisponible,
    iniciarEntrega,
    confirmarEntrega,
  } = useTransportistaDeliveryStore();

  const pendientes  = deliveries.filter((d) => d.status === 'pendiente').length;
  const totalHoy    = deliveries.reduce((s, d) => s + d.earning, 0);

  function handleIniciar(delivery: Delivery) {
    Alert.alert(
      'Iniciar entrega',
      `¿Comenzar la entrega a ${delivery.clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, iniciar',
          onPress: () => {
            iniciarEntrega(delivery.id);
            const url = `https://www.google.com/maps/dir/?api=1` +
              `&origin=${WAREHOUSE_LAT},${WAREHOUSE_LNG}` +
              `&destination=${delivery.lat},${delivery.lng}` +
              `&travelmode=driving`;
            Linking.openURL(url);
          },
        },
      ]
    );
  }

  function handleConfirmar(delivery: Delivery) {
    Alert.alert(
      'Confirmar entrega',
      `¿Confirmar que entregaste el pedido a ${delivery.clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, confirmar', onPress: () => confirmarEntrega(delivery.id) },
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
        {activeTab === 'entregas' && (
          <EntregasTab
            deliveries={deliveries}
            totalHoy={totalHoy}
            onIniciar={handleIniciar}
            onConfirmar={handleConfirmar}
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
          icon="cube-outline"
          label="Entregas"
          active={activeTab === 'entregas'}
          badge={pendientes}
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
    </SafeAreaView>
  );
}

// ─── Tab: Entregas ────────────────────────────────────────────────────────────

function EntregasTab({
  deliveries,
  totalHoy,
  onIniciar,
  onConfirmar,
}: {
  deliveries: Delivery[];
  totalHoy:   number;
  onIniciar:  (d: Delivery) => void;
  onConfirmar:(d: Delivery) => void;
}) {
  const pendientes   = deliveries.filter((d) => d.status === 'pendiente').length;
  const entregadas   = deliveries.filter((d) => d.status === 'entregado').length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumen rápido */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="cube-outline" size={20} color={C.header} />
          <Text style={styles.summaryValue}>{deliveries.length}</Text>
          <Text style={styles.summaryLabel}>Entregas hoy</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color={C.greenDark} />
          <Text style={[styles.summaryValue, { color: C.greenDark }]}>{entregadas}</Text>
          <Text style={styles.summaryLabel}>Completadas</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardAmber, { flex: 1 }]}>
          <Ionicons name="cash-outline" size={20} color={C.headerDark} />
          <Text style={[styles.summaryValue, { color: C.headerDark }]}>${totalHoy.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: C.header }]}>Ganancia</Text>
        </View>
      </View>

      {/* Lista de entregas */}
      <Text style={styles.sectionTitle}>Entregas del día</Text>

      {deliveries.map((delivery) => (
        <DeliveryCard
          key={delivery.id}
          delivery={delivery}
          onIniciar={() => onIniciar(delivery)}
          onConfirmar={() => onConfirmar(delivery)}
        />
      ))}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function vehicleIcon(vehicle: string): keyof typeof Ionicons.glyphMap {
  switch (vehicle) {
    case 'moto':      return 'bicycle-outline';
    case 'taxi':      return 'car-outline';
    case 'camioneta': return 'car';
    default:          return 'car-outline';
  }
}

// ─── Card de entrega ──────────────────────────────────────────────────────────

function DeliveryCard({
  delivery,
  onIniciar,
  onConfirmar,
}: {
  delivery:   Delivery;
  onIniciar:  () => void;
  onConfirmar:() => void;
}) {
  const isPendiente  = delivery.status === 'pendiente';
  const isEnCamino   = delivery.status === 'en_camino';
  const isEntregado  = delivery.status === 'entregado';

  const statusColor =
    isPendiente  ? C.textSoft  :
    isEnCamino   ? C.orange    : C.greenDark;

  const statusLabel =
    isPendiente  ? 'Pendiente'   :
    isEnCamino   ? 'En camino'   : 'Entregado';

  const statusIcon: keyof typeof Ionicons.glyphMap =
    isPendiente  ? 'time-outline'      :
    isEnCamino   ? 'navigate'          : 'checkmark-circle';

  return (
    <View style={[
      styles.deliveryCard,
      isEnCamino  && styles.deliveryCardOrange,
      isEntregado && styles.deliveryCardGreen,
    ]}>
      {/* Cabecera */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardOrderId}>Pedido #{delivery.id}</Text>
          <View style={styles.timeSlotRow}>
            <Ionicons name="time-outline" size={12} color={C.textSoft} />
            <Text style={styles.timeSlotText}>{delivery.timeSlot}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
          <Ionicons name={statusIcon} size={13} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Cliente */}
      <View style={styles.clientRow}>
        <Ionicons name="person-outline" size={14} color={C.textSoft} />
        <Text style={styles.clientName}>{delivery.clientName}</Text>
      </View>

      {/* Dirección */}
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={14} color={C.header} />
        <Text style={styles.addressText} numberOfLines={2}>{delivery.address}</Text>
      </View>

      {/* Separador */}
      <View style={styles.cardDivider} />

      {/* Métricas */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name={vehicleIcon(delivery.vehicle)} size={22} color={C.header} />
          <View>
            <Text style={styles.metricLabel}>Vehículo</Text>
            <Text style={styles.metricValue}>{delivery.vehicleLabel}</Text>
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="navigate-outline" size={18} color={C.header} />
          <View>
            <Text style={styles.metricLabel}>Distancia</Text>
            <Text style={styles.metricValue}>{delivery.distanceKm.toFixed(1)} km</Text>
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="cash-outline" size={18} color={C.greenDark} />
          <View>
            <Text style={styles.metricLabel}>Ganancia</Text>
            <Text style={[styles.metricValue, { color: C.greenDark }]}>
              +${delivery.earning.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      {isPendiente && (
        <TouchableOpacity style={styles.iniciarBtn} activeOpacity={0.85} onPress={onIniciar}>
          <Ionicons name="navigate-outline" size={18} color={C.white} />
          <Text style={styles.iniciarBtnText}>Iniciar entrega</Text>
        </TouchableOpacity>
      )}

      {isEnCamino && (
        <View style={styles.actionGroup}>
          <View style={styles.enCaminoBanner}>
            <Ionicons name="navigate" size={15} color={C.orange} />
            <Text style={styles.enCaminoText}>En camino al destino...</Text>
          </View>
          <TouchableOpacity style={styles.confirmarBtn} activeOpacity={0.85} onPress={onConfirmar}>
            <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
            <Text style={styles.confirmarBtnText}>Confirmar entrega</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEntregado && (
        <View style={styles.entregadoBanner}>
          <Ionicons name="checkmark-circle" size={15} color={C.greenDark} />
          <Text style={styles.entregadoText}>Entrega completada</Text>
        </View>
      )}
    </View>
  );
}

// ─── Tab: Mapa ────────────────────────────────────────────────────────────────

const QUITO_REGION: Region = {
  latitude:      -0.2105,
  longitude:     -78.4900,
  latitudeDelta:  0.18,
  longitudeDelta: 0.18,
};

function MapaTab({
  activeDelivery,
  deliveries,
  onOpenMaps,
}: {
  activeDelivery: Delivery | null;
  deliveries:     Delivery[];
  onOpenMaps:     (d: Delivery) => void;
}) {
  return (
    <View style={styles.mapContainer}>
      {/* Mapa */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        mapType="none"
        initialRegion={QUITO_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Marcador: Mercado Mayorista (origen) */}
        <Marker
          coordinate={{ latitude: WAREHOUSE_LAT, longitude: WAREHOUSE_LNG }}
          title="Mercado Mayorista"
          description="Punto de origen"
        >
          <View style={styles.warehouseMarker}>
            <Ionicons name="storefront" size={16} color={C.headerDark} />
          </View>
        </Marker>

        {/* Marcadores de entregas */}
        {deliveries.filter((d) => d.status !== 'entregado').map((d) => (
          <Marker
            key={d.id}
            coordinate={{ latitude: d.lat, longitude: d.lng }}
            title={`Pedido #${d.id}`}
            description={d.clientName}
          >
            <View style={[
              styles.deliveryMarker,
              d.status === 'en_camino' && styles.deliveryMarkerActive,
            ]}>
              <Ionicons
                name={d.status === 'en_camino' ? 'car' : 'cube'}
                size={14}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Panel superior: entrega activa */}
      {activeDelivery ? (
        <View style={styles.mapActivePanel}>
          <View style={styles.mapActivePanelLeft}>
            <View style={styles.mapActiveDot} />
            <View>
              <Text style={styles.mapActivePanelTitle}>
                En camino · #{activeDelivery.id}
              </Text>
              <Text style={styles.mapActivePanelSub} numberOfLines={1}>
                {activeDelivery.clientName} · {activeDelivery.address}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.mapOpenBtn}
            activeOpacity={0.85}
            onPress={() => onOpenMaps(activeDelivery)}
          >
            <Ionicons name="navigate" size={16} color={C.white} />
            <Text style={styles.mapOpenBtnText}>Navegar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapNoActivePanel}>
          <Ionicons name="map-outline" size={18} color={C.textSoft} />
          <Text style={styles.mapNoActiveText}>Sin entrega activa</Text>
        </View>
      )}

      {/* Panel inferior: leyenda */}
      <View style={styles.mapLegend}>
        <View style={styles.mapLegendItem}>
          <Ionicons name="storefront" size={15} color={C.headerDark} />
          <Text style={styles.mapLegendText}>Mercado Mayorista</Text>
        </View>
        <View style={styles.mapLegendItem}>
          <Ionicons name="cube" size={15} color={C.headerDark} />
          <Text style={styles.mapLegendText}>Entrega pendiente</Text>
        </View>
        <View style={styles.mapLegendItem}>
          <Ionicons name="car" size={15} color={C.orange} />
          <Text style={styles.mapLegendText}>En camino</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tab: Ganancias ───────────────────────────────────────────────────────────

function GananciasTab() {
  const {
    weeklyEarnings, weeklyKm,
    todayEarnings, todayDeliveriesCount, todayKm,
    totalDeliveriesCount,
  } = useTransportistaStore();

  const payFriday    = nextPayFriday();
  const WEEKLY_TARGET = 100;
  const pct           = Math.min(weeklyEarnings / WEEKLY_TARGET, 1);

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
        <View style={styles.weekCardStats}>
          <Ionicons name="navigate-outline" size={14} color={C.greenDark} />
          <Text style={styles.weekCardStatText}>{weeklyKm.toFixed(1)} km · {totalDeliveriesCount} entregas</Text>
        </View>
        <View style={styles.payRow}>
          <Ionicons name="calendar-outline" size={14} color={C.greenDark} />
          <Text style={styles.payText}>Próximo pago: {formatShortDate(payFriday)}</Text>
        </View>
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
          <Ionicons name="cube-outline" size={20} color={C.header} />
          <Text style={styles.summaryValue}>{todayDeliveriesCount}</Text>
          <Text style={styles.summaryLabel}>Entregas</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="navigate-outline" size={20} color={C.header} />
          <Text style={styles.summaryValue}>{todayKm.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>km</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardAmber, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={20} color={C.headerDark} />
          <Text style={[styles.summaryValue, { color: C.headerDark }]}>${todayEarnings.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: C.header }]}>Ganancia</Text>
        </View>
      </View>

      {/* Tarifa */}
      <Text style={styles.sectionTitle}>Tarifa por entrega</Text>
      <View style={styles.tarifaCard}>
        <View style={styles.formulaRow}>
          <View style={styles.formulaChip}>
            <Text style={styles.formulaLabel}>Base fija</Text>
            <Text style={styles.formulaValue}>${TRANSPORTISTA_BASE.toFixed(2)}</Text>
          </View>
          <Ionicons name="add" size={18} color={C.textSoft} />
          <View style={styles.formulaChip}>
            <Text style={styles.formulaLabel}>Por km</Text>
            <Text style={styles.formulaValue}>${TRANSPORTISTA_PER_KM.toFixed(2)}</Text>
          </View>
        </View>
        {[3, 7, 12, 20].map((km) => (
          <View key={km} style={styles.exRow}>
            <View style={styles.kmBadge}>
              <Text style={styles.kmBadgeText}>{km} km</Text>
            </View>
            <Text style={styles.exLabel}>
              {km <= 5 ? 'Zona cercana' : km <= 10 ? 'Zona media' : km <= 15 ? 'Zona lejana' : 'Zona extra'}
            </Text>
            <Text style={styles.exEarning}>
              +${(TRANSPORTISTA_BASE + TRANSPORTISTA_PER_KM * km).toFixed(2)}
            </Text>
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
      <View style={styles.perfilAvatarWrapper}>
        <View style={styles.perfilAvatar}>
          <Ionicons name="car" size={38} color={C.header} />
        </View>
        <Text style={styles.perfilName}>Roberto Mendoza</Text>
        <View style={styles.perfilRolePill}>
          <Text style={styles.perfilRoleText}>Transportista</Text>
        </View>
      </View>

      <View style={styles.perfilCard}>
        <PerfilRow icon="call-outline"      label="Teléfono"   value="+593 98 765 4321" />
        <View style={styles.cardDivider} />
        <PerfilRow icon="card-outline"      label="Cédula"     value="17XXXXXXXX" />
        <View style={styles.cardDivider} />
        <PerfilRow icon="car-outline"       label="Vehículo"   value="Camioneta D-MAX" />
        <View style={styles.cardDivider} />
        <PerfilRow icon="document-text-outline" label="Matrícula" value="PBA-2341" />
        <View style={styles.cardDivider} />
        <PerfilRow icon="shield-checkmark-outline" label="Estado" value="Verificado" valueColor={C.greenDark} />
      </View>

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
  icon, label, active, badge = 0, badgeColor, onPress,
}: {
  icon:        keyof typeof Ionicons.glyphMap;
  label:       string;
  active:      boolean;
  badge?:      number;
  badgeColor?: string;
  onPress:     () => void;
}) {
  const activeIcon = icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap;
  return (
    <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.tabIconWrapper}>
        <Ionicons
          name={active ? activeIcon : icon}
          size={24}
          color={active ? C.tabActive : C.tabInactive}
        />
        {badge > 0 && (
          <View style={[styles.tabBadge, badgeColor ? { backgroundColor: badgeColor } : null]}>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerName:     { fontSize: 17, fontWeight: '800', color: C.white },

  disponibleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.5)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  noDisponibleBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  disponibleDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  noDisponibleDot: { backgroundColor: 'rgba(255,255,255,0.5)' },
  disponibleText:  { fontSize: 13, fontWeight: '700', color: C.green },
  noDisponibleText:{ color: 'rgba(255,255,255,0.6)' },

  // ── Body & Scroll
  body:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, gap: 12 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: C.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4,
  },

  // ── Resumen
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: C.amberBorder,
    shadowColor: C.header, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  summaryCardAmber: { backgroundColor: C.amberFaint },
  summaryValue:     { fontSize: 22, fontWeight: '800', color: C.text },
  summaryLabel:     { fontSize: 11, color: C.textSoft, fontWeight: '600', textAlign: 'center' },

  // ── Delivery card
  deliveryCard: {
    backgroundColor: C.white, borderRadius: 18,
    padding: 16, gap: 10,
    borderWidth: 1.5, borderColor: C.amberBorder,
    shadowColor: C.header, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  deliveryCardOrange: { borderColor: C.orange, backgroundColor: '#FFFBF5' },
  deliveryCardGreen:  { borderColor: C.greenDark, backgroundColor: C.greenFaint },

  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  cardHeaderLeft: { gap: 4 },
  cardOrderId:    { fontSize: 16, fontWeight: '800', color: C.text },
  timeSlotRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeSlotText:   { fontSize: 12, color: C.textSoft, fontWeight: '500' },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  clientRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientName:  { fontSize: 13, color: C.textMid, fontWeight: '600' },
  addressRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressText: { flex: 1, fontSize: 13, color: C.header, fontWeight: '500', lineHeight: 18 },

  cardDivider: { height: 1, backgroundColor: '#F0F0F0' },

  // Métricas en fila
  metricsRow: { flexDirection: 'row', alignItems: 'center' },
  metricItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  metricDivider: { width: 1, height: 32, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  metricEmoji:   { fontSize: 20 },
  metricLabel:   { fontSize: 10, color: C.textSoft, textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue:   { fontSize: 14, fontWeight: '700', color: C.text },

  // Botones de acción
  iniciarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.header, borderRadius: 12,
    paddingVertical: 13, marginTop: 2,
  },
  iniciarBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  actionGroup: { gap: 8, marginTop: 2 },
  enCaminoBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: C.orangeFaint, borderRadius: 10, paddingVertical: 8,
  },
  enCaminoText: { fontSize: 13, fontWeight: '600', color: C.orange },

  confirmarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.greenDark, borderRadius: 12, paddingVertical: 13,
  },
  confirmarBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  entregadoBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: C.greenFaint, borderRadius: 10, paddingVertical: 10, marginTop: 2,
  },
  entregadoText: { fontSize: 14, fontWeight: '600', color: C.greenDark },

  // ── Mapa
  mapContainer: { flex: 1 },

  mapActivePanel: {
    position: 'absolute', top: 12, left: 12, right: 12,
    backgroundColor: C.white, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  mapActivePanelLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  mapActiveDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: C.orange },
  mapActivePanelTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  mapActivePanelSub:   { fontSize: 11, color: C.textSoft, marginTop: 1 },
  mapOpenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.header, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  mapOpenBtnText: { fontSize: 13, fontWeight: '700', color: C.white },

  mapNoActivePanel: {
    position: 'absolute', top: 12, left: 12, right: 12,
    backgroundColor: C.white, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  mapNoActiveText: { fontSize: 13, color: C.textSoft, fontWeight: '500' },

  mapLegend: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  mapLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mapLegendEmoji:{ fontSize: 14 },
  mapLegendText: { fontSize: 12, color: C.textMid, fontWeight: '500' },

  // Marcadores del mapa
  warehouseMarker: {
    backgroundColor: C.white, borderRadius: 22, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.header,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  warehouseMarkerEmoji: { fontSize: 20 },
  deliveryMarker: {
    backgroundColor: C.white, borderRadius: 20, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.amberBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  deliveryMarkerActive: {
    borderColor: C.orange, backgroundColor: C.orangeFaint,
  },
  deliveryMarkerEmoji: { fontSize: 18 },

  // ── Ganancias tab
  weekCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: C.amberBorder, gap: 6,
    shadowColor: C.header, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  weekCardLabel:    { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  weekCardAmount:   { fontSize: 44, fontWeight: '800', color: C.green, letterSpacing: -1 },
  weekCardStats:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weekCardStatText: { fontSize: 13, color: C.greenDark, fontWeight: '600' },
  payRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payText:    { fontSize: 13, color: C.greenDark, fontWeight: '600' },
  progressTrack: {
    height: 7, backgroundColor: C.amberFaint, borderRadius: 4, overflow: 'hidden', marginTop: 4,
  },
  progressFill:  { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: C.textSoft },

  tarifaCard: {
    backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.amberBorder,
  },
  formulaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 16,
  },
  formulaChip: {
    backgroundColor: C.amberFaint, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  formulaLabel: { fontSize: 10, color: C.textSoft, fontWeight: '600', textTransform: 'uppercase' },
  formulaValue: { fontSize: 18, fontWeight: '800', color: C.headerDark },
  exRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: C.amberFaint,
    gap: 10,
  },
  kmBadge: {
    backgroundColor: C.amberLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 50, alignItems: 'center',
  },
  kmBadgeText: { fontSize: 13, fontWeight: '800', color: C.headerDark },
  exLabel:     { flex: 1, fontSize: 13, color: C.textMid },
  exEarning:   { fontSize: 14, fontWeight: '800', color: C.greenDark },

  // ── Perfil
  perfilAvatarWrapper: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  perfilAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.amberFaint, borderWidth: 3, borderColor: C.amberBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  perfilAvatarEmoji: { fontSize: 38 },
  perfilName:        { fontSize: 22, fontWeight: '800', color: C.text },
  perfilRolePill: {
    backgroundColor: C.amberFaint, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: C.amberBorder,
  },
  perfilRoleText: { fontSize: 13, fontWeight: '700', color: C.header },

  perfilCard: {
    backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: C.amberBorder, overflow: 'hidden',
    shadowColor: C.header, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  perfilRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  perfilRowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.amberFaint, alignItems: 'center', justifyContent: 'center',
  },
  perfilRowLabel: { flex: 1, fontSize: 14, color: C.textSoft },
  perfilRowValue: { fontSize: 14, fontWeight: '700', color: C.text },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: '#FADADD',
    borderRadius: 14, paddingVertical: 14,
    backgroundColor: '#FFF5F5', marginTop: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E74C3C' },

  // ── Bottom tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.amberBorder,
    paddingBottom: 4, paddingTop: 6,
  },
  tabItem:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  tabIconWrapper: { position: 'relative' },
  tabBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#E74C3C', borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  tabBadgeText:    { fontSize: 10, fontWeight: '800', color: C.white },
  tabLabel:        { fontSize: 11, fontWeight: '600', color: C.tabInactive },
  tabLabelActive:  { color: C.tabActive },
});

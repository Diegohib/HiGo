import {
  useState,
  useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import MapView, { Marker, UrlTile, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import {
  useTransportistaDeliveryStore,
  Delivery,
  WAREHOUSE_LAT,
  WAREHOUSE_LNG,
} from '../store/transportistaDeliveryStore';
import { useTransportistaStore } from '../store/transportistaStore';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { cardShadow } from '../theme/elevation';
import AppearanceSelector from '../components/AppearanceSelector';
import { pickAvatarPhoto } from '../lib/pickAvatarPhoto';
import Avatar from '../components/Avatar';
import {
  nextPayFriday,
  formatShortDate,
} from '../utils/earnings';
import { VEHICLES } from '../utils/transport';

// ─── Paleta ───────────────────────────────────────────────────────────────────
// El morado de marca de la app es el color de este dashboard (fijo en ambos
// temas, igual que en Cochero y Comerciante — los 3 paneles operativos
// comparten identidad en vez de cada uno tener un color suelto); los
// fondos/superficies/texto se adaptan según el tema activo.

function useScreenColors() {
  const T = useThemeColors();
  return {
    header:       '#3D1F8B',
    headerDark:   '#2D1570',
    headerFaint:  T.primaryFaint,
    amberBorder:  T.border,
    green:        '#2ECC71',
    greenDark:    '#27AE60',
    greenFaint:   T.successFaint,
    orange:       '#E67E22',
    orangeFaint:  T.warningFaint,
    bg:           T.background,
    white:        T.surface,
    text:         T.text,
    textMid:      T.textSoft,
    textSoft:     T.textFaint,
    tabActive:    '#3D1F8B',
    tabInactive:  T.textFaint,
  };
}
type ScreenColors = ReturnType<typeof useScreenColors>;

type Tab = 'entregas' | 'mapa' | 'ganancias' | 'perfil';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'TransportistaDashboard'>;
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function TransportistaDashboardScreen({ navigation }: Props) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const [activeTab, setActiveTab] = useState<Tab>('entregas');

  const {
    disponibles,
    mias,
    disponible,
    toggleDisponible,
    iniciarEntrega,
    confirmarEntrega,
  } = useTransportistaDeliveryStore();

  const user = useAuthStore((s) => s.user);

  const entregadasHoy = mias.filter((d) => d.status === 'entregado').length;
  const totalHoy       = mias.reduce((s, d) => s + d.earning, 0);
  const activeDelivery = mias.find((d) => d.status === 'en_camino') ?? null;
  const mapPoints      = [...disponibles, ...mias];

  function openInMaps(delivery: Delivery) {
    if (delivery.lat == null || delivery.lng == null) return;
    const url = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${WAREHOUSE_LAT},${WAREHOUSE_LNG}` +
      `&destination=${delivery.lat},${delivery.lng}` +
      `&travelmode=driving`;
    Linking.openURL(url);
  }

  function handleIniciar(delivery: Delivery) {
    Alert.alert(
      'Iniciar entrega',
      `Vas a tomar el pedido #${delivery.id.slice(0, 6)} y salir hacia la dirección de entrega.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, iniciar',
          onPress: () => {
            iniciarEntrega(delivery.id);
            openInMaps(delivery);
          },
        },
      ]
    );
  }

  function handleConfirmar(delivery: Delivery) {
    Alert.alert(
      'Confirmar entrega',
      delivery.cashToCollect > 0
        ? `¿Entregaste el pedido #${delivery.id.slice(0, 6)} y cobraste ${delivery.cashToCollect.toFixed(2)} en efectivo?`
        : `¿Confirmás que entregaste el pedido #${delivery.id.slice(0, 6)}?`,
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
      <LinearGradient colors={[C.header, C.headerDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user?.name ?? 'Transportista'} photoUri={user?.photoUri} size={46} />
          <View>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerName}>{user?.name ?? 'Transportista'}</Text>
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
      </LinearGradient>

      {/* ── Contenido por tab ── */}
      <View style={styles.body}>
        {activeTab === 'entregas' && (
          <EntregasTab
            disponibles={disponibles}
            mias={mias}
            entregadasHoy={entregadasHoy}
            totalHoy={totalHoy}
            onIniciar={handleIniciar}
            onConfirmar={handleConfirmar}
          />
        )}
        {activeTab === 'mapa'      && (
          <MapaTab
            activeDelivery={activeDelivery}
            deliveries={mapPoints}
            onOpenMaps={openInMaps}
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
          badge={disponibles.length}
          onPress={() => setActiveTab('entregas')}
        />
        <TabBarItem
          icon="map-outline"
          label="Mapa"
          active={activeTab === 'mapa'}
          onPress={() => setActiveTab('mapa')}
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
  disponibles,
  mias,
  entregadasHoy,
  totalHoy,
  onIniciar,
  onConfirmar,
}: {
  disponibles:   Delivery[];
  mias:          Delivery[];
  entregadasHoy: number;
  totalHoy:      number;
  onIniciar:     (d: Delivery) => void;
  onConfirmar:   (d: Delivery) => void;
}) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const enCurso = mias.filter((d) => d.status !== 'entregado').length;

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
          <Text style={styles.summaryValue}>{enCurso}</Text>
          <Text style={styles.summaryLabel}>En curso</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color={C.greenDark} />
          <Text style={[styles.summaryValue, { color: C.greenDark }]}>{entregadasHoy}</Text>
          <Text style={styles.summaryLabel}>Entregadas</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardHeader, { flex: 1 }]}>
          <Ionicons name="cash-outline" size={20} color={C.white} />
          <Text style={[styles.summaryValue, { color: C.white }]}>${totalHoy.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Ganancia</Text>
        </View>
      </View>

      {/* Disponibles */}
      <Text style={styles.sectionTitle}>Disponibles ({disponibles.length})</Text>
      {disponibles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={40} color={C.textSoft} />
          <Text style={styles.emptyStateText}>No hay pedidos listos para transportar</Text>
        </View>
      ) : (
        disponibles.map((d) => (
          <DeliveryCard key={d.id} delivery={d} onIniciar={() => onIniciar(d)} />
        ))
      )}

      {/* Mis entregas */}
      <Text style={styles.sectionTitle}>Mis entregas</Text>
      {mias.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={40} color={C.textSoft} />
          <Text style={styles.emptyStateText}>Todavía no tomaste ninguna entrega</Text>
        </View>
      ) : (
        mias.map((d) => (
          <DeliveryCard key={d.id} delivery={d} onConfirmar={() => onConfirmar(d)} />
        ))
      )}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ─── Card de entrega ──────────────────────────────────────────────────────────

function DeliveryCard({
  delivery,
  onIniciar,
  onConfirmar,
}: {
  delivery:     Delivery;
  onIniciar?:   () => void;
  onConfirmar?: () => void;
}) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const isDisponible = delivery.status === 'recibido' || delivery.status === 'consolidado';
  const isEnCamino   = delivery.status === 'en_camino';
  const isEntregado  = delivery.status === 'entregado';

  const statusColor =
    isDisponible ? C.textSoft :
    isEnCamino   ? C.orange   : C.greenDark;

  const statusLabel =
    isDisponible ? 'Disponible' :
    isEnCamino   ? 'En camino'  : 'Entregado';

  const statusIcon: keyof typeof Ionicons.glyphMap =
    isDisponible ? 'time-outline' :
    isEnCamino   ? 'navigate'     : 'checkmark-circle';

  const isDirecta = delivery.route === 'directa';

  return (
    <View style={[
      styles.deliveryCard,
      isEnCamino  && styles.deliveryCardOrange,
      isEntregado && styles.deliveryCardGreen,
    ]}>
      {/* Cabecera */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardOrderId}>Pedido #{delivery.id.slice(0, 6)}</Text>
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

      {/* Ruta */}
      <View style={styles.clientRow}>
        <Ionicons name={isDirecta ? 'flash-outline' : 'storefront-outline'} size={14} color={C.textSoft} />
        <Text style={styles.clientName}>
          {isDirecta ? 'Lo antes posible · retirar del cochero' : 'Programada · retirar del cochero'}
        </Text>
      </View>

      {/* Cobro en efectivo */}
      {delivery.cashToCollect > 0 && !isEntregado && (
        <View style={styles.clientRow}>
          <Ionicons name="cash-outline" size={14} color={C.orange} />
          <Text style={[styles.clientName, { color: C.orange, fontWeight: '700' }]}>
            Cobrar ${delivery.cashToCollect.toFixed(2)} en efectivo
          </Text>
        </View>
      )}

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
          <Ionicons name="cube-outline" size={18} color={C.header} />
          <View>
            <Text style={styles.metricLabel}>Productos</Text>
            <Text style={styles.metricValue}>{delivery.itemCount}</Text>
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="navigate-outline" size={18} color={C.header} />
          <View>
            <Text style={styles.metricLabel}>Distancia</Text>
            <Text style={styles.metricValue}>
              {delivery.distanceKm > 0 ? `${delivery.distanceKm.toFixed(1)} km` : '—'}
            </Text>
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="cash-outline" size={18} color={C.header} />
          <View>
            <Text style={styles.metricLabel}>Ganancia</Text>
            <Text style={[styles.metricValue, { color: C.header }]}>
              +${delivery.earning.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      {isDisponible && onIniciar && (
        <TouchableOpacity style={styles.iniciarBtn} activeOpacity={0.85} onPress={onIniciar}>
          <Ionicons name="navigate-outline" size={18} color={C.white} />
          <Text style={styles.iniciarBtnText}>Iniciar entrega</Text>
        </TouchableOpacity>
      )}

      {isEnCamino && (
        <View style={styles.actionGroup}>
          <View style={styles.enCaminoBanner}>
            <Ionicons name="navigate" size={15} color={C.orange} />
            <Text style={styles.enCaminoText}>En camino al destino…</Text>
          </View>
          {onConfirmar && (
            <TouchableOpacity style={styles.confirmarBtn} activeOpacity={0.85} onPress={onConfirmar}>
              <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
              <Text style={styles.confirmarBtnText}>Confirmar entrega</Text>
            </TouchableOpacity>
          )}
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

// Encuadre inicial: centrado entre el mercado (sur) y el grueso de Quito, para
// que entren tanto el origen como las direcciones de entrega.
const QUITO_REGION: Region = {
  latitude:      -0.225,
  longitude:     -78.508,
  latitudeDelta:  0.24,
  longitudeDelta: 0.14,
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
  const C = useScreenColors();
  const styles = makeStyles(C);
  return (
    <View style={styles.mapContainer}>
      {/* Mapa */}
      <MapView
        style={StyleSheet.absoluteFill}
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
        {deliveries
          .filter((d) => d.status !== 'entregado' && d.lat != null && d.lng != null)
          .map((d) => (
            <Marker
              key={d.id}
              coordinate={{ latitude: d.lat as number, longitude: d.lng as number }}
              title={`Pedido #${d.id.slice(0, 6)}`}
              description={d.address}
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
                En camino · #{activeDelivery.id.slice(0, 6)}
              </Text>
              <Text style={styles.mapActivePanelSub} numberOfLines={1}>
                {activeDelivery.address}
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
          <Text style={styles.mapLegendText}>Entrega por hacer</Text>
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
  const C = useScreenColors();
  const styles = makeStyles(C);
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
          <Ionicons name="navigate-outline" size={14} color={C.header} />
          <Text style={styles.weekCardStatText}>{weeklyKm.toFixed(1)} km · {totalDeliveriesCount} entregas</Text>
        </View>
        <View style={styles.payRow}>
          <Ionicons name="calendar-outline" size={14} color={C.header} />
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
        <View style={[styles.summaryCard, styles.summaryCardHeader, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={20} color={C.white} />
          <Text style={[styles.summaryValue, { color: C.white }]}>${todayEarnings.toFixed(2)}</Text>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Ganancia</Text>
        </View>
      </View>

      {/* Tarifa */}
      {/* Cobra el envío completo que paga el cliente: tarifa según vehículo
          (por el peso del pedido) y distancia desde el mercado. */}
      <Text style={styles.sectionTitle}>Tarifa por entrega (el envío completo)</Text>
      <View style={styles.tarifaCard}>
        {VEHICLES.map((v) => (
          <View key={v.type} style={styles.exRow}>
            <View style={styles.kmBadge}>
              <Text style={styles.kmBadgeText}>{v.emoji} {v.label}</Text>
            </View>
            <Text style={styles.exLabel}>
              {v.maxLbs === Infinity ? 'Más de 150 lb' : `Hasta ${v.maxLbs} lb`}
            </Text>
            <Text style={styles.exEarning}>
              ${v.base.toFixed(2)} + ${v.perKm.toFixed(2)}/km
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
      <View style={styles.perfilAvatarWrapper}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => pickAvatarPhoto(updatePhoto)}>
          <View style={{ position: 'relative' }}>
            <Avatar name={user?.name ?? 'Transportista'} photoUri={user?.photoUri} size={80} bg={C.headerFaint} textColor={C.header} />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={C.white} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.perfilName}>{user?.name ?? 'Transportista'}</Text>
        <View style={styles.perfilRolePill}>
          <Text style={styles.perfilRoleText}>Transportista</Text>
        </View>
      </View>

      <View style={styles.perfilCard}>
        <PerfilRow icon="call-outline"      label="Teléfono"   value={user?.phone ?? '—'} />
        <View style={styles.cardDivider} />
        <PerfilRow icon="card-outline"      label="Cédula"     value={user?.cedula ?? '—'} />
        <View style={styles.cardDivider} />
        <PerfilRow icon="shield-checkmark-outline" label="Estado" value="Verificado" valueColor={C.greenDark} />
      </View>

      <Text style={styles.sectionTitle}>Apariencia</Text>
      <AppearanceSelector accentColor={C.header} />

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
  icon, label, active, badge = 0, badgeColor, onPress,
}: {
  icon:        keyof typeof Ionicons.glyphMap;
  label:       string;
  active:      boolean;
  badge?:      number;
  badgeColor?: string;
  onPress:     () => void;
}) {
  const C = useScreenColors();
  const styles = makeStyles(C);
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

const makeStyles = (C: ScreenColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.header },

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
  disponibleDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.greenDark },
  noDisponibleDot: { backgroundColor: 'rgba(255,255,255,0.5)' },
  disponibleText:  { fontSize: 13, fontWeight: '700', color: C.greenDark },
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
    backgroundColor: C.white, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: C.amberBorder,
    ...cardShadow(C, C.header),
  },
  summaryCardHeader: { backgroundColor: C.header, borderColor: C.header },
  summaryValue:     { fontSize: 22, fontWeight: '800', color: C.text },
  summaryLabel:     { fontSize: 11, color: C.textSoft, fontWeight: '600', textAlign: 'center' },

  // ── Delivery card
  deliveryCard: {
    backgroundColor: C.white, borderRadius: 18,
    padding: 16, gap: 10,
    borderWidth: 1.5, borderColor: C.amberBorder,
    ...cardShadow(C, C.header),
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
    gap: 8, backgroundColor: C.header, borderRadius: 12, paddingVertical: 13,
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
    ...cardShadow(C, C.header),
  },
  weekCardLabel:    { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  weekCardAmount:   { fontSize: 44, fontWeight: '800', color: C.header, letterSpacing: -1 },
  weekCardStats:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weekCardStatText: { fontSize: 13, color: C.header, fontWeight: '600' },
  payRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payText:    { fontSize: 13, color: C.header, fontWeight: '600' },
  progressTrack: {
    height: 7, backgroundColor: C.headerFaint, borderRadius: 4, overflow: 'hidden', marginTop: 4,
  },
  progressFill:  { height: '100%', backgroundColor: C.header, borderRadius: 4 },
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
    backgroundColor: C.headerFaint, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  formulaLabel: { fontSize: 10, color: C.textSoft, fontWeight: '600', textTransform: 'uppercase' },
  formulaValue: { fontSize: 18, fontWeight: '800', color: C.headerDark },
  exRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: C.headerFaint,
    gap: 10,
  },
  kmBadge: {
    backgroundColor: C.headerFaint, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 50, alignItems: 'center',
  },
  kmBadgeText: { fontSize: 13, fontWeight: '800', color: C.headerDark },
  exLabel:     { flex: 1, fontSize: 13, color: C.textMid },
  exEarning:   { fontSize: 14, fontWeight: '800', color: C.header },

  // ── Perfil
  perfilAvatarWrapper: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  perfilAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.headerFaint, borderWidth: 3, borderColor: C.amberBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  perfilAvatarEmoji: { fontSize: 38 },
  avatarEditBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.header, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  perfilName:        { fontSize: 22, fontWeight: '800', color: C.text },
  perfilRolePill: {
    backgroundColor: C.headerFaint, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: C.amberBorder,
  },
  perfilRoleText: { fontSize: 13, fontWeight: '700', color: C.header },

  perfilCard: {
    backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: C.amberBorder, overflow: 'hidden',
    ...cardShadow(C, C.header),
  },
  perfilRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  perfilRowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.headerFaint, alignItems: 'center', justifyContent: 'center',
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

  // ── Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyStateText: { fontSize: 15, fontWeight: '600', color: C.textSoft },

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

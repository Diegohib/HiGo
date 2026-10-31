import {
  useEffect,
  useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, RootStackParamList } from '../navigation/types';
import { useOrdersStore, OrderStatus } from '../store/ordersStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Nav   = StackNavigationProp<HomeStackParamList, 'OrderTracking'>;
type Route = RouteProp<HomeStackParamList, 'OrderTracking'>;

// ─── Definición de estados ────────────────────────────────────────────────────

interface StatusStep {
  key: OrderStatus;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Ya no cada paso tiene su propio color suelto (antes era literalmente un
// color distinto por estado — azul, naranja, otro azul, amarillo, verde, sin
// ninguna relación entre sí). Ahora es un esquema de 3 colores consistente en
// toda la línea de tiempo: gris = todavía no llega, morado = en curso ahora
// mismo (con el pulso), verde = ya completado. Se ve como una progresión real,
// no como un arcoíris.
const STEPS: StatusStep[] = [
  { key: 'recibido',    label: 'Recibido',    sublabel: 'Tu pedido fue confirmado',        icon: 'checkmark-circle' },
  { key: 'en_mercado',  label: 'En mercado',  sublabel: 'El cochero recorre los puestos',  icon: 'storefront' },
  { key: 'consolidado', label: 'Consolidado', sublabel: 'Productos listos para envío',     icon: 'cube' },
  { key: 'en_camino',   label: 'En camino',   sublabel: 'Tu pedido va hacia ti',           icon: 'bicycle' },
  { key: 'entregado',   label: 'Entregado',   sublabel: '¡Pedido entregado con éxito!',    icon: 'home' },
];

// Solo pedidos viejos (operatorRole 'transportista'): entrega directa sin
// paso por el mercado. Hoy todo pedido pasa por un cochero.
const DIRECT_STEPS: StatusStep[] = STEPS.filter(
  (s) => s.key !== 'en_mercado' && s.key !== 'consolidado'
);

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OrderTrackingScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route      = useRoute<Route>();
  const { orderId } = route.params;

  const order = useOrdersStore((s) => s.orders.find((o) => o.id === orderId));

  // El pedido avanza solo por acciones reales: el cochero lo reclama y
  // consolida (store/cocheroTicketStore.ts), y el transportista lo pone en
  // camino y confirma la entrega (store/transportistaDeliveryStore.ts).

  // Halo que pulsa detrás del punto del paso actual en la línea de tiempo —
  // para que se sienta "en curso" de verdad, no solo un color estático.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 750, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 750, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={C.statusBarStyle} />
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FFF" />
          <Text style={styles.notFoundText}>No se encontró este pedido.</Text>
          <TouchableOpacity style={styles.notFoundBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.notFoundBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    address,
    estimatedTime,
    operatorRole,
    deliveryLat,
    deliveryLng,
  } = order;
  const currentStatus: OrderStatus = order.status;

  const steps        = operatorRole === 'transportista' ? DIRECT_STEPS : STEPS;
  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === currentStatus));
  const currentStep  = steps[currentIndex];
  const isEnCamino    = currentStatus === 'en_camino';
  const isEntregado   = currentStatus === 'entregado';
  const badgeColor    = isEntregado ? C.success : C.primary;

  // Qué operativo mostrar: el cochero mientras el pedido está en el mercado o
  // consolidándose; el transportista una vez que el pedido va en camino (o
  // siempre, si es entrega directa y no pasa por el mercado).
  const showTransportista = isEnCamino || isEntregado || operatorRole === 'transportista';
  const op = {
    role:  showTransportista ? 'Transportista' : 'Cochero',
    icon:  (showTransportista ? 'car' : 'bicycle') as 'car' | 'bicycle',
    name:  showTransportista ? order.transportistaName  : order.operatorName,
    phone: showTransportista ? order.transportistaPhone : order.operatorPhone,
    uid:   showTransportista ? order.transportistaUid   : order.operatorUid,
    searching: showTransportista
      ? 'Buscando transportista para tu pedido…'
      : 'Buscando quién recoge tu pedido…',
  };
  const opUnassigned = !op.name;

  // Aviso de pago: solo cuando hay algo que el cliente tenga que saber.
  const payment =
    order.paymentStatus === 'por_verificar' ? {
      icon: 'time-outline' as const, color: C.warning,
      text: 'Estamos verificando tu transferencia. Tu pedido empieza a prepararse apenas la confirmemos.',
    } :
    order.paymentStatus === 'rechazado' ? {
      icon: 'alert-circle-outline' as const, color: C.danger,
      text: 'No pudimos confirmar tu transferencia. Escribinos por el chat para resolverlo.',
    } :
    order.paymentStatus === 'contra_entrega' ? {
      icon: 'cash-outline' as const, color: C.primary,
      text: `Pagás ${order.total.toFixed(2)} en efectivo al recibir tu pedido.`,
    } :
    order.paymentStatus === 'verificado' ? {
      icon: 'checkmark-circle-outline' as const, color: C.success,
      text: 'Pago confirmado.',
    } : null;

  function handleCall() {
    if (op.phone) Linking.openURL(`tel:${op.phone}`);
  }

  function handleMessage() {
    rootNavigation.navigate('OrderChat', { orderId });
  }

  function handleMap() {
    if (deliveryLat != null && deliveryLng != null) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${deliveryLat},${deliveryLng}`
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      {/* Header */}
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estado del pedido</Text>
        <TouchableOpacity
          onPress={() => rootNavigation.navigate('Assistant')}
          style={styles.backBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {payment && (
          <View style={[styles.paymentBanner, { borderColor: payment.color }]}>
            <Ionicons name={payment.icon} size={20} color={payment.color} />
            <Text style={styles.paymentBannerText}>{payment.text}</Text>
          </View>
        )}

        {/* Tarjeta resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="receipt-outline" size={18} color={C.primary} />
            <Text style={styles.summaryLabel}>Pedido</Text>
            <Text style={styles.summaryValue}>#{orderId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Ionicons name="location-outline" size={18} color={C.primary} />
            <Text style={styles.summaryLabel}>Entrega en</Text>
            <Text style={[styles.summaryValue, styles.summaryAddress]} numberOfLines={2}>
              {address}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={18} color={C.primary} />
            <Text style={styles.summaryLabel}>Hora estimada</Text>
            <Text style={styles.summaryValue}>{estimatedTime}</Text>
          </View>
        </View>

        {/* Badge estado actual — morado mientras avanza, verde al entregar */}
        <View style={[styles.statusBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor }]}>
          <Ionicons name={currentStep.icon} size={20} color={badgeColor} />
          <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
            {currentStep.label}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          {steps.map((step, index) => {
            const isDone    = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture  = index > currentIndex;
            const isLast    = index === steps.length - 1;

            // Esquema fijo de 3 colores en vez de un color suelto por paso:
            // gris = todavía no llega, morado = en curso, verde = completado.
            const dotColor = isDone ? C.success : isCurrent ? C.primary : '#CCC';

            return (
              <View key={step.key} style={styles.timelineRow}>

                {/* Columna izquierda: dot + línea */}
                <View style={styles.timelineLeft}>
                  {isCurrent && (
                    <Animated.View
                      style={[styles.pulseHalo, { backgroundColor: C.primary, transform: [{ scale: pulse }] }]}
                      pointerEvents="none"
                    />
                  )}
                  <View style={[
                    styles.dot,
                    { borderColor: dotColor, backgroundColor: isFuture ? '#FFF' : dotColor },
                    isCurrent && styles.dotCurrent,
                  ]}>
                    {isDone && (
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    )}
                    {isCurrent && (
                      <Ionicons name="ellipse" size={8} color="#FFF" />
                    )}
                  </View>
                  {!isLast && (
                    <View style={[styles.line, { backgroundColor: index < currentIndex ? C.success : '#E0E0E0' }]} />
                  )}
                </View>

                {/* Contenido del paso */}
                <View style={[styles.stepContent, isLast && { paddingBottom: 0 }]}>
                  <View style={styles.stepHeader}>
                    <Text style={[
                      styles.stepLabel,
                      isCurrent && { color: C.primary, fontWeight: '700' },
                      isFuture  && styles.stepLabelFuture,
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.activePill, { backgroundColor: C.primary }]}>
                        <Text style={styles.activePillText}>Actual</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stepSublabel, isFuture && styles.stepSublabelFuture]}>
                    {step.sublabel}
                  </Text>
                </View>

              </View>
            );
          })}
        </View>

        {/* Tarjeta de éxito: solo cuando entregado */}
        {isEntregado && (
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
            </View>
            <Text style={styles.successTitle}>¡Pedido entregado!</Text>
            <Text style={styles.successSubtitle}>Gracias por usar HiGo</Text>
          </View>
        )}

        {/* Tarjeta operador */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorHeader}>
            <View style={styles.operatorAvatar}>
              <Ionicons name={op.icon} size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.operatorRole}>{op.role}</Text>
              <Text style={styles.operatorName}>
                {opUnassigned ? op.searching : op.name}
              </Text>
            </View>
            {!opUnassigned && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {!!op.uid && (
                  <TouchableOpacity style={styles.callBtn} onPress={handleMessage}>
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!opUnassigned && !!op.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="phone-portrait-outline" size={15} color={C.textFaint} />
              <Text style={styles.phoneText}>{op.phone}</Text>
            </View>
          )}
        </View>

        {/* Botón rastrear en mapa */}
        {isEnCamino && (
          <TouchableOpacity style={styles.mapBtn} onPress={handleMap} activeOpacity={0.85}>
            <Ionicons name="map" size={20} color="#FFF" />
            <Text style={styles.mapBtnText}>Rastrear en mapa</Text>
          </TouchableOpacity>
        )}

        {/* Botón nuevo pedido: solo cuando entregado */}
        {isEntregado && (
          <TouchableOpacity
            style={styles.newOrderBtn}
            activeOpacity={0.85}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <Ionicons name="cart-outline" size={20} color="#FFF" />
            <Text style={styles.newOrderBtnText}>Hacer nuevo pedido</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: C.surface,
  },
  paymentBannerText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: C.text },
  safe: {
    flex: 1,
    backgroundColor: C.headerGradient[0],
  },

  // Pedido no encontrado
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  notFoundText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  notFoundBtn: {
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  notFoundBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Contenido
  content: {
    backgroundColor: C.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    minHeight: '100%',
  },

  // Tarjeta resumen
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: C.textFaint,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '55%',
  },
  summaryAddress: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: C.primaryFaint,
  },

  // Badge estado
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 20,
  },
  statusBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
  },
  // Halo detrás del punto del paso actual — pulsa con Animated (ver `pulse`
  // en el componente), da la sensación de que ese paso está "vivo" ahora.
  pulseHalo: {
    position: 'absolute',
    top: -6,
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.18,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dotCurrent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  stepLabelFuture: {
    color: '#BDBDBD',
    fontWeight: '400',
  },
  stepSublabel: {
    fontSize: 12,
    color: '#757575',
  },
  stepSublabelFuture: {
    color: '#BDBDBD',
  },
  activePill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activePillText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '700',
  },

  // Operador
  operatorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  operatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  operatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primaryFaint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorRole: {
    fontSize: 12,
    color: C.textFaint,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginTop: 1,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0EEFF',
  },
  phoneText: {
    fontSize: 13,
    color: C.textSoft,
  },

  // Tarjeta éxito
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 28,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  successIconWrapper: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  successSubtitle: {
    fontSize: 14,
    color: C.textFaint,
  },

  // Botón nuevo pedido
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  newOrderBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Botón mapa
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  mapBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

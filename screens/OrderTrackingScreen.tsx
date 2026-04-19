import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'recibido'
  | 'en_mercado'
  | 'consolidado'
  | 'en_camino'
  | 'entregado';

type Nav   = StackNavigationProp<HomeStackParamList, 'OrderTracking'>;
type Route = RouteProp<HomeStackParamList, 'OrderTracking'>;

// ─── Definición de estados ────────────────────────────────────────────────────

interface StatusStep {
  key: OrderStatus;
  label: string;
  sublabel: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const STEPS: StatusStep[] = [
  {
    key: 'recibido',
    label: 'Recibido',
    sublabel: 'Tu pedido fue confirmado',
    color: '#1565C0',
    icon: 'checkmark-circle',
  },
  {
    key: 'en_mercado',
    label: 'En mercado',
    sublabel: 'El cochero está recolectando',
    color: '#E65100',
    icon: 'storefront',
  },
  {
    key: 'consolidado',
    label: 'Consolidado',
    sublabel: 'Productos listos para envío',
    color: '#0277BD',
    icon: 'cube',
  },
  {
    key: 'en_camino',
    label: 'En camino',
    sublabel: 'Tu pedido va hacia ti',
    color: '#F9A825',
    icon: 'bicycle',
  },
  {
    key: 'entregado',
    label: 'Entregado',
    sublabel: '¡Pedido entregado con éxito!',
    color: '#2E7D32',
    icon: 'home',
  },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  recibido: 0,
  en_mercado: 1,
  consolidado: 2,
  en_camino: 3,
  entregado: 4,
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OrderTrackingScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();

  const {
    orderId,
    address,
    estimatedTime,
    currentStatus,
    operatorName,
    operatorPhone,
    operatorRole,
    deliveryLat,
    deliveryLng,
  } = route.params;

  const currentIndex = STATUS_INDEX[currentStatus];
  const currentStep  = STEPS[currentIndex];
  const isEnCamino   = currentStatus === 'en_camino';

  function handleCall() {
    Linking.openURL(`tel:${operatorPhone}`);
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
      <StatusBar barStyle="light-content" backgroundColor="#3D1F8B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estado del pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Tarjeta resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="receipt-outline" size={18} color="#3D1F8B" />
            <Text style={styles.summaryLabel}>Pedido</Text>
            <Text style={styles.summaryValue}>#{orderId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Ionicons name="location-outline" size={18} color="#3D1F8B" />
            <Text style={styles.summaryLabel}>Entrega en</Text>
            <Text style={[styles.summaryValue, styles.summaryAddress]} numberOfLines={2}>
              {address}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={18} color="#3D1F8B" />
            <Text style={styles.summaryLabel}>Hora estimada</Text>
            <Text style={styles.summaryValue}>{estimatedTime}</Text>
          </View>
        </View>

        {/* Badge estado actual */}
        <View style={[styles.statusBadge, { backgroundColor: currentStep.color + '18', borderColor: currentStep.color }]}>
          <Ionicons name={currentStep.icon} size={20} color={currentStep.color} />
          <Text style={[styles.statusBadgeText, { color: currentStep.color }]}>
            {currentStep.label}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          {STEPS.map((step, index) => {
            const isDone    = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture  = index > currentIndex;
            const isLast    = index === STEPS.length - 1;

            const dotColor  = isFuture ? '#CCC' : step.color;
            const lineColor = isDone || isCurrent ? step.color : '#E0E0E0';

            return (
              <View key={step.key} style={styles.timelineRow}>

                {/* Columna izquierda: dot + línea */}
                <View style={styles.timelineLeft}>
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
                    <View style={[styles.line, { backgroundColor: index < currentIndex ? STEPS[index].color : '#E0E0E0' }]} />
                  )}
                </View>

                {/* Contenido del paso */}
                <View style={[styles.stepContent, isLast && { paddingBottom: 0 }]}>
                  <View style={styles.stepHeader}>
                    <Text style={[
                      styles.stepLabel,
                      isCurrent && { color: step.color, fontWeight: '700' },
                      isFuture  && styles.stepLabelFuture,
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.activePill, { backgroundColor: step.color }]}>
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

        {/* Tarjeta operador */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorHeader}>
            <View style={styles.operatorAvatar}>
              <Ionicons
                name={operatorRole === 'cochero' ? 'bicycle' : 'car'}
                size={22}
                color="#3D1F8B"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.operatorRole}>
                {operatorRole === 'cochero' ? 'Cochero' : 'Transportista'}
              </Text>
              <Text style={styles.operatorName}>{operatorName}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.phoneRow}>
            <Ionicons name="phone-portrait-outline" size={15} color="#9B8EC4" />
            <Text style={styles.phoneText}>{operatorPhone}</Text>
          </View>
        </View>

        {/* Botón rastrear en mapa */}
        {isEnCamino && (
          <TouchableOpacity style={styles.mapBtn} onPress={handleMap} activeOpacity={0.85}>
            <Ionicons name="map" size={20} color="#FFF" />
            <Text style={styles.mapBtnText}>Rastrear en mapa</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#3D1F8B',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#3D1F8B',
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
    backgroundColor: '#F7F5FF',
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
    color: '#9B8EC4',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '55%',
  },
  summaryAddress: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EEFF',
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
    color: '#1A1A1A',
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
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorRole: {
    fontSize: 12,
    color: '#9B8EC4',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 1,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3D1F8B',
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
    color: '#555',
  },

  // Botón mapa
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F9A825',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#F9A825',
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

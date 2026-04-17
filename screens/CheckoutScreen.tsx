import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { RootStackParamList } from '../navigation/types';
import { useCartStore } from '../store/cartStore';
import { PRODUCTS } from '../data/products';
import { calcTransport, TransportInfo } from '../utils/transport';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MANAGEMENT_FEE = 0.07;

type DeliveryType = 'programada' | 'directa';
type TimeSlot     = '10:00 - 12:00' | '14:00 - 16:00';

const IS_USER_REGISTERED = false; // reemplazar con store de auth

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList, 'Checkout'>>();
  const rootNav    = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route      = useRoute<RouteProp<HomeStackParamList, 'Checkout'>>();
  const { items }  = useCartStore();

  // ── Dirección ───────────────────────────────────────────────────────────────
  const [address,   setAddress]   = useState('');
  const [reference, setReference] = useState('');
  const [hasMapPin, setHasMapPin] = useState(false);
  const [pinLat,    setPinLat]    = useState<number | null>(null);
  const [pinLng,    setPinLng]    = useState<number | null>(null);

  useEffect(() => {
    const p = route.params;
    if (p?.pickedAddress && p.pickedLat != null && p.pickedLng != null) {
      setAddress(p.pickedAddress);
      setPinLat(p.pickedLat);
      setPinLng(p.pickedLng);
      setHasMapPin(true);
    }
  }, [route.params?.pickedAddress, route.params?.pickedLat, route.params?.pickedLng]);

  // ── Horario ─────────────────────────────────────────────────────────────────
  const [delivery, setDelivery] = useState<DeliveryType>('programada');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('10:00 - 12:00');

  // ── Modal ───────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);

  // ── Peso total del pedido (lbs) ─────────────────────────────────────────────
  const totalWeightLbs = useMemo(() =>
    items.reduce((sum, item) => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      const w = product?.presentations[item.presentationIndex]?.weightLbs ?? 0;
      return sum + w * item.quantity;
    }, 0),
  [items]);

  // ── Transporte calculado (Haversine) ────────────────────────────────────────
  const transport: TransportInfo | null = useMemo(() => {
    if (pinLat == null || pinLng == null) return null;
    return calcTransport(totalWeightLbs, pinLat, pinLng);
  }, [totalWeightLbs, pinLat, pinLng]);

  // ── Resumen económico ───────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.presentationPrice * i.quantity, 0);
  const gestion  = subtotal * MANAGEMENT_FEE;
  const transCost = transport?.cost ?? 0;
  const total     = subtotal + gestion + transCost;

  // ── Confirmar pedido ────────────────────────────────────────────────────────
  function handleConfirm() {
    if (!IS_USER_REGISTERED) { setShowModal(true); return; }
    // TODO: enviar pedido al backend
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3D1F8B" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar pedido</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Sección: Dirección ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="#3D1F8B" />
              <Text style={styles.sectionTitle}>Dirección de entrega</Text>
            </View>

            {/* Botón del mapa */}
            <TouchableOpacity
              style={[styles.mapBtn, hasMapPin && styles.mapBtnActive]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MapPicker')}
            >
              <View style={[styles.mapBtnIcon, hasMapPin && styles.mapBtnIconActive]}>
                <Ionicons
                  name={hasMapPin ? 'location' : 'location-outline'}
                  size={22}
                  color={hasMapPin ? '#FFFFFF' : '#3D1F8B'}
                />
              </View>
              <View style={styles.mapBtnContent}>
                {hasMapPin ? (
                  <>
                    <Text style={styles.mapBtnLabel}>Ubicación seleccionada</Text>
                    <Text style={styles.mapBtnAddress} numberOfLines={2}>{address}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.mapBtnLabel}>Seleccionar ubicación en mapa</Text>
                    <Text style={styles.mapBtnSub}>Toca para abrir el mapa de Quito</Text>
                  </>
                )}
              </View>
              <Ionicons
                name={hasMapPin ? 'pencil-outline' : 'chevron-forward'}
                size={17}
                color={hasMapPin ? '#3D1F8B' : '#9B8EC4'}
              />
            </TouchableOpacity>

            {/* Card de transporte: aparece cuando hay pin */}
            {transport ? (
              <View style={styles.transportCard}>
                <View style={styles.transportTop}>
                  <Text style={styles.transportEmoji}>{transport.vehicleEmoji}</Text>
                  <View style={styles.transportInfo}>
                    <Text style={styles.transportVehicle}>{transport.vehicleLabel}</Text>
                    <Text style={styles.transportDetail}>
                      {transport.distanceKm.toFixed(1)} km desde el Mercado Mayorista
                    </Text>
                  </View>
                  <View style={styles.transportCostBadge}>
                    <Text style={styles.transportCostText}>${transport.cost.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.transportDivider} />
                <View style={styles.transportWeightRow}>
                  <Ionicons name="scale-outline" size={13} color="#9B8EC4" />
                  <Text style={styles.transportWeightText}>
                    Pedido: {totalWeightLbs.toFixed(1)} lbs ·{' '}
                    {totalWeightLbs < 30
                      ? 'cabe en moto'
                      : totalWeightLbs <= 150
                      ? 'requiere taxi'
                      : 'requiere camioneta'}
                  </Text>
                </View>
              </View>
            ) : (
              hasMapPin === false && (
                <View style={styles.transportPlaceholder}>
                  <Ionicons name="information-circle-outline" size={15} color="#9B8EC4" />
                  <Text style={styles.transportPlaceholderText}>
                    Selecciona tu ubicación para calcular el costo de transporte
                  </Text>
                </View>
              )
            )}

            {/* Campo de referencia */}
            <View style={styles.inputWrapper}>
              <Ionicons name="flag-outline" size={16} color="#9B8EC4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Referencia: Casa azul junto al parque"
                placeholderTextColor="#BEB3E0"
                value={reference}
                onChangeText={setReference}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Sección: Horario ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#3D1F8B" />
              <Text style={styles.sectionTitle}>Horario de entrega</Text>
            </View>

            {/* Entrega Programada */}
            <TouchableOpacity
              style={[styles.deliveryCard, delivery === 'programada' && styles.deliveryCardActive]}
              activeOpacity={0.85}
              onPress={() => setDelivery('programada')}
            >
              <View style={styles.deliveryCardTop}>
                <View style={styles.deliveryCardLeft}>
                  <View style={[styles.radioOuter, delivery === 'programada' && styles.radioOuterActive]}>
                    {delivery === 'programada' && <View style={styles.radioInner} />}
                  </View>
                  <View>
                    <Text style={[styles.deliveryCardTitle, delivery === 'programada' && styles.deliveryCardTitleActive]}>
                      Entrega Programada
                    </Text>
                    <Text style={styles.deliveryCardSub}>Elige tu ventana horaria</Text>
                  </View>
                </View>
                <View style={styles.savingBadge}>
                  <Ionicons name="pricetag-outline" size={11} color="#2ECC71" />
                  <Text style={styles.savingBadgeText}>Más económico</Text>
                </View>
              </View>
              {delivery === 'programada' && (
                <View style={styles.slotRow}>
                  {(['10:00 - 12:00', '14:00 - 16:00'] as TimeSlot[]).map(slot => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotBtn, timeSlot === slot && styles.slotBtnActive]}
                      activeOpacity={0.8}
                      onPress={() => setTimeSlot(slot)}
                    >
                      <Ionicons name="sunny-outline" size={13} color={timeSlot === slot ? '#3D1F8B' : '#9B8EC4'} />
                      <Text style={[styles.slotText, timeSlot === slot && styles.slotTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            {/* Entrega Directa */}
            <TouchableOpacity
              style={[styles.deliveryCard, delivery === 'directa' && styles.deliveryCardActive]}
              activeOpacity={0.85}
              onPress={() => setDelivery('directa')}
            >
              <View style={styles.deliveryCardTop}>
                <View style={styles.deliveryCardLeft}>
                  <View style={[styles.radioOuter, delivery === 'directa' && styles.radioOuterActive]}>
                    {delivery === 'directa' && <View style={styles.radioInner} />}
                  </View>
                  <View>
                    <Text style={[styles.deliveryCardTitle, delivery === 'directa' && styles.deliveryCardTitleActive]}>
                      Entrega Directa
                    </Text>
                    <Text style={styles.deliveryCardSub}>Lo antes posible · Prioridad alta</Text>
                  </View>
                </View>
                <View style={styles.urgentBadge}>
                  <Ionicons name="flash-outline" size={11} color="#E67E22" />
                  <Text style={styles.urgentBadgeText}>Inmediata</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Sección: Resumen final ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color="#3D1F8B" />
              <Text style={styles.sectionTitle}>Resumen final</Text>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gestión (7%)</Text>
                <Text style={styles.summaryValue}>${gestion.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                {transport ? (
                  <>
                    <View style={styles.summaryLabelRow}>
                      <Text style={styles.summaryLabel}>Transporte</Text>
                      <View style={styles.vehicleChip}>
                        <Text style={styles.vehicleChipText}>
                          {transport.vehicleEmoji} {transport.vehicleLabel} · {transport.distanceKm.toFixed(1)} km
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryValue}>${transport.cost.toFixed(2)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.summaryLabel}>Transporte</Text>
                    <Text style={styles.summaryPending}>Selecciona ubicación</Text>
                  </>
                )}
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>

              {!transport && (
                <Text style={styles.totalNote}>* El total definitivo incluirá el costo de transporte</Text>
              )}
            </View>
          </View>

          {/* ── Botón confirmar ── */}
          <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>Confirmar pedido</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal: usuario no registrado ── */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="person-circle-outline" size={52} color="#3D1F8B" />
            </View>
            <Text style={styles.modalTitle}>¡Casi listo!</Text>
            <Text style={styles.modalBody}>
              Para completar tu pedido necesitas crear una cuenta gratis.{'\n'}Solo toma un minuto.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => { setShowModal(false); rootNav.navigate('Register'); }}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.modalPrimaryBtnText}>Crear cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondaryBtn} activeOpacity={0.7} onPress={() => setShowModal(false)}>
              <Text style={styles.modalSecondaryBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#3D1F8B' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#3D1F8B',
  },
  headerBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },

  // Scroll
  scroll: { backgroundColor: '#F7F5FF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 40, gap: 20 },

  // Sección genérica
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },

  // Botón del mapa
  mapBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 2, borderColor: '#E0D9F5',
    padding: 14, gap: 12,
    shadowColor: '#3D1F8B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  mapBtnActive: { borderColor: '#3D1F8B', backgroundColor: '#F3F0FF' },
  mapBtnIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EDE7F6', alignItems: 'center', justifyContent: 'center',
  },
  mapBtnIconActive: { backgroundColor: '#3D1F8B' },
  mapBtnContent: { flex: 1, gap: 2 },
  mapBtnLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  mapBtnAddress: { fontSize: 13, color: '#3D1F8B', fontWeight: '500', lineHeight: 18 },
  mapBtnSub: { fontSize: 12, color: '#9B8EC4' },

  // Card de transporte
  transportCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#3D1F8B',
    padding: 14, gap: 10,
    shadowColor: '#3D1F8B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  transportTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transportEmoji: { fontSize: 32 },
  transportInfo: { flex: 1, gap: 2 },
  transportVehicle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  transportDetail: { fontSize: 12, color: '#9B8EC4', lineHeight: 16 },
  transportCostBadge: {
    backgroundColor: '#EDE7F6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  transportCostText: { fontSize: 16, fontWeight: '800', color: '#3D1F8B' },
  transportDivider: { height: 1, backgroundColor: '#E0D9F5' },
  transportWeightRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  transportWeightText: { fontSize: 12, color: '#9B8EC4', flex: 1 },

  // Placeholder transporte
  transportPlaceholder: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: '#F3F0FF', borderRadius: 12, padding: 12,
  },
  transportPlaceholderText: { flex: 1, fontSize: 13, color: '#9B8EC4', lineHeight: 18 },

  // Input referencia
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0D9F5',
    paddingHorizontal: 14, paddingVertical: 4, gap: 8,
  },
  inputIcon: { marginRight: 2 },
  input: { flex: 1, fontSize: 14, color: '#1A1A1A', paddingVertical: 13 },

  // Tarjetas de horario
  deliveryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 2, borderColor: '#E0D9F5',
    padding: 16, gap: 12,
    shadowColor: '#3D1F8B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  deliveryCardActive: { borderColor: '#3D1F8B', backgroundColor: '#F3F0FF' },
  deliveryCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deliveryCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#BEB3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#3D1F8B' },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#3D1F8B' },
  deliveryCardTitle: { fontSize: 15, fontWeight: '700', color: '#555' },
  deliveryCardTitleActive: { color: '#3D1F8B' },
  deliveryCardSub: { fontSize: 12, color: '#9B8EC4', marginTop: 2 },

  savingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EAFAF1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  savingBadgeText: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },

  urgentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF0E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  urgentBadgeText: { fontSize: 11, fontWeight: '700', color: '#E67E22' },

  slotRow: { flexDirection: 'row', gap: 10 },
  slotBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E0D9F5', backgroundColor: '#FFFFFF',
  },
  slotBtnActive: { borderColor: '#3D1F8B', backgroundColor: '#EDE7F6' },
  slotText: { fontSize: 13, fontWeight: '600', color: '#9B8EC4' },
  slotTextActive: { color: '#3D1F8B' },

  // Resumen
  summaryBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 12,
    shadowColor: '#3D1F8B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabelRow: { flexDirection: 'column', gap: 4, flex: 1, marginRight: 8 },
  summaryLabel: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  summaryPending: { fontSize: 13, color: '#BEB3E0', fontStyle: 'italic' },
  vehicleChip: {
    alignSelf: 'flex-start', backgroundColor: '#F3F0FF',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  vehicleChipText: { fontSize: 11, color: '#3D1F8B', fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#E0D9F5', marginVertical: 2 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#3D1F8B' },
  totalNote: { fontSize: 11, color: '#BEB3E0', fontStyle: 'italic', textAlign: 'center' },

  // Botón confirmar
  confirmBtn: {
    backgroundColor: '#2ECC71', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16,
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(20,10,50,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center', gap: 14,
    shadowColor: '#3D1F8B', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalIconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F3F0FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  modalBody: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 21 },
  modalPrimaryBtn: {
    backgroundColor: '#3D1F8B', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14,
    width: '100%', marginTop: 4,
  },
  modalPrimaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalSecondaryBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  modalSecondaryBtnText: { fontSize: 15, color: '#9B8EC4', fontWeight: '600' },
});

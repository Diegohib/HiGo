import {
  useState,
  useEffect,
  useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { RootStackParamList } from '../navigation/types';
import { useCartStore, useAgotadosEnCarrito } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrdersStore, PaymentMethod, CASH_LIMIT } from '../store/ordersStore';
import { usePaymentConfig } from '../store/paymentConfigStore';
import PaymentMethodSection from '../components/PaymentMethodSection';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useProductsStore } from '../store/productsStore';
import { calcTransport, TransportInfo } from '../utils/transport';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { cardShadow, floatingShadow } from '../theme/elevation';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MANAGEMENT_FEE = 0.07;
const MINIMUM_ORDER  = 15;

type DeliveryType = 'programada' | 'directa';
type TimeSlot     = '10:00 - 12:00' | '14:00 - 16:00';

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList, 'Checkout'>>();
  const rootNav    = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route      = useRoute<RouteProp<HomeStackParamList, 'Checkout'>>();
  const { items }  = useCartStore();
  const products   = useProductsStore((s) => s.products);
  const user          = useAuthStore((s) => s.user);
  const isRegistered  = user !== null;
  const { clearCart } = useCartStore();
  const agotados = useAgotadosEnCarrito();
  const createOrder   = useOrdersStore((s) => s.createOrder);
  const [confirming, setConfirming] = useState(false);

  // ── Dirección ───────────────────────────────────────────────────────────────
  // Se precarga con la dirección guardada en el perfil (si hay); elegir otra
  // ubicación en el mapa la reemplaza solo para este pedido, sin tocar la guardada.
  const [address,   setAddress]   = useState(user?.address ?? '');
  const [reference, setReference] = useState(user?.addressReference ?? '');
  const [hasMapPin, setHasMapPin] = useState(user?.addressLat != null && user?.addressLng != null);
  const [pinLat,    setPinLat]    = useState<number | null>(user?.addressLat ?? null);
  const [pinLng,    setPinLng]    = useState<number | null>(user?.addressLng ?? null);

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

  // ── Pago ────────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [receiptUri,    setReceiptUri]    = useState<string | null>(null);
  const [paymentRef,    setPaymentRef]    = useState('');
  const { bank, loaded: bankLoaded } = usePaymentConfig();

  async function pickReceipt() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Activá el acceso a tus fotos para subir el comprobante.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) setReceiptUri(result.assets[0].uri);
  }

  async function uploadReceipt(uid: string, localUri: string): Promise<string> {
    const blob = await (await fetch(localUri)).blob();
    const fileRef = storageRef(storage, `receipts/${uid}/${Date.now()}.jpg`);
    await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(fileRef);
  }

  // ── Modal ───────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);

  // ── Peso total del pedido (lbs) ─────────────────────────────────────────────
  const totalWeightLbs = useMemo(() =>
    items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const w = product?.presentations[item.presentationIndex]?.weightLbs ?? 0;
      return sum + w * item.quantity;
    }, 0),
  [items, products]);

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

  // Si el total pasa el tope del efectivo (p. ej. al cambiar la ubicación y
  // subir el envío), se vuelve a transferencia.
  useEffect(() => {
    if (paymentMethod === 'efectivo' && total > CASH_LIMIT) setPaymentMethod('transferencia');
  }, [total, paymentMethod]);

  // ── Confirmar pedido ────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!isRegistered || !user) { setShowModal(true); return; }
    if (!hasMapPin) { return; }
    if (agotados.length > 0) {
      Alert.alert(
        'Hay productos agotados',
        `${agotados.map(p => p.name).join(', ')} se agotó por hoy. Quitalo del carrito para seguir.`
      );
      return;
    }
    if (total < MINIMUM_ORDER) {
      Alert.alert(
        'Pedido mínimo no alcanzado',
        `El total debe ser al menos $${MINIMUM_ORDER.toFixed(2)}. Volvé al carrito para agregar más productos.`
      );
      return;
    }

    if (paymentMethod === 'efectivo' && total > CASH_LIMIT) {
      Alert.alert('Efectivo no disponible', `El pago en efectivo es solo para pedidos de hasta ${CASH_LIMIT}. Elegí transferencia.`);
      return;
    }
    if (paymentMethod === 'transferencia') {
      if (!bank) {
        Alert.alert('Transferencia no disponible', 'Todavía no hay una cuenta bancaria configurada. Elegí otra forma de pago.');
        return;
      }
      if (paymentRef.trim().length < 4) {
        Alert.alert('Falta el comprobante', 'Escribí el número de comprobante de tu transferencia.');
        return;
      }
    }

    const estimatedTime = delivery === 'directa' ? 'Lo antes posible' : timeSlot;
    // Todo pedido pasa por un cochero (trabaja en el mercado: junta lo de
    // cada puesto) y después por un transportista. 'directa' solo le da
    // prioridad. Nadie queda asignado al crear el pedido — cada operativo lo
    // reclama de verdad desde su panel.
    const operatorRole = 'cochero' as const;
    const deliveryType = delivery === 'directa' ? 'directa' as const : 'programada' as const;

    setConfirming(true);
    try {
      // La foto se sube antes de crear el pedido, para guardarla junto. Es
      // opcional: si falla (p. ej. Storage no disponible) el pedido sigue, ya
      // que el número de comprobante alcanza para verificar.
      let receiptUrl: string | undefined;
      if (paymentMethod === 'transferencia' && receiptUri) {
        try {
          receiptUrl = await uploadReceipt(user.uid, receiptUri);
        } catch (err) {
          console.error('[Checkout] receipt upload:', err);
        }
      }
      const orderId = await createOrder({
        uid:           user.uid,
        address:       address || 'Dirección no especificada',
        estimatedTime,
        operatorRole,
        deliveryType,
        operatorName:       '',
        operatorPhone:      '',
        operatorUid:        '',
        transportistaName:  '',
        transportistaPhone: '',
        transportistaUid:   '',
        deliveryLat:   pinLat ?? undefined,
        deliveryLng:   pinLng ?? undefined,
        subtotal,
        managementFee: gestion,
        shippingCost:  transCost,
        vehicle:       transport?.vehicle,
        paymentMethod,
        // Transferencia: queda retenido hasta que el admin confirme el pago.
        paymentStatus: paymentMethod === 'transferencia' ? 'por_verificar' : 'contra_entrega',
        released:      paymentMethod === 'efectivo',
        ...(receiptUrl ? { receiptUrl } : {}),
        ...(paymentMethod === 'transferencia' ? { paymentRef: paymentRef.trim() } : {}),
        total,
        items,
      });
      clearCart();
      navigation.navigate('OrderTracking', { orderId });
    } catch {
      Alert.alert('No se pudo confirmar el pedido', 'Revisá tu conexión e intentá de nuevo.');
    } finally {
      setConfirming(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      {/* ── Header ── */}
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar pedido</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

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
              <Ionicons name="location-outline" size={20} color={C.primary} />
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
                  color={hasMapPin ? '#FFFFFF' : C.primary}
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
                color={hasMapPin ? C.primary : C.textFaint}
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
                  <Ionicons name="scale-outline" size={13} color={C.textFaint} />
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
                  <Ionicons name="information-circle-outline" size={15} color={C.textFaint} />
                  <Text style={styles.transportPlaceholderText}>
                    Selecciona tu ubicación para calcular el costo de transporte
                  </Text>
                </View>
              )
            )}

            {/* Campo de referencia */}
            <View style={styles.inputWrapper}>
              <Ionicons name="flag-outline" size={16} color={C.textFaint} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Referencia: Casa azul junto al parque"
                placeholderTextColor={C.textFaint}
                value={reference}
                onChangeText={setReference}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Sección: Horario ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={C.primary} />
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
                      <Ionicons name="sunny-outline" size={13} color={timeSlot === slot ? C.primary : C.textFaint} />
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

          {/* ── Sección: Forma de pago ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="wallet-outline" size={20} color={C.primary} />
              <Text style={styles.sectionTitle}>Forma de pago</Text>
            </View>
            <PaymentMethodSection
              total={total}
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              bank={bank}
              bankLoaded={bankLoaded}
              receiptUri={receiptUri}
              onPickReceipt={pickReceipt}
              paymentRef={paymentRef}
              onPaymentRef={setPaymentRef}
            />
          </View>

          {/* ── Sección: Resumen final ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={C.primary} />
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
          <TouchableOpacity
            style={[styles.confirmBtn, (!hasMapPin || total < MINIMUM_ORDER || confirming) && styles.confirmBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleConfirm}
            disabled={confirming}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>
              {confirming
                ? 'Confirmando…'
                : !hasMapPin
                ? 'Selecciona tu ubicación primero'
                : total < MINIMUM_ORDER
                ? `Pedido mínimo $${MINIMUM_ORDER.toFixed(2)}`
                : 'Confirmar pedido'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal: usuario no registrado ── */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="person-circle-outline" size={52} color={C.primary} />
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

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.headerGradient[0] },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },

  // Scroll
  scroll: { backgroundColor: C.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 40, gap: 20 },

  // Sección genérica
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  // Botón del mapa
  mapBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 2, borderColor: C.border,
    padding: 14, gap: 12,
    ...cardShadow(C),
  },
  mapBtnActive: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  mapBtnIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center',
  },
  mapBtnIconActive: { backgroundColor: C.primary },
  mapBtnContent: { flex: 1, gap: 2 },
  mapBtnLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  mapBtnAddress: { fontSize: 13, color: C.primary, fontWeight: '500', lineHeight: 18 },
  mapBtnSub: { fontSize: 12, color: C.textFaint },

  // Card de transporte
  transportCard: {
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.primary,
    padding: 14, gap: 10,
    ...cardShadow(C),
  },
  transportTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transportEmoji: { fontSize: 32 },
  transportInfo: { flex: 1, gap: 2 },
  transportVehicle: { fontSize: 15, fontWeight: '800', color: C.text },
  transportDetail: { fontSize: 12, color: C.textFaint, lineHeight: 16 },
  transportCostBadge: {
    backgroundColor: C.primaryFaint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  transportCostText: { fontSize: 16, fontWeight: '800', color: C.primary },
  transportDivider: { height: 1, backgroundColor: C.border },
  transportWeightRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  transportWeightText: { fontSize: 12, color: C.textFaint, flex: 1 },

  // Placeholder transporte
  transportPlaceholder: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: C.primaryFaint, borderRadius: 12, padding: 12,
  },
  transportPlaceholderText: { flex: 1, fontSize: 13, color: C.textFaint, lineHeight: 18 },

  // Input referencia
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 4, gap: 8,
  },
  inputIcon: { marginRight: 2 },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 13 },

  // Tarjetas de horario
  deliveryCard: {
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 2, borderColor: C.border,
    padding: 16, gap: 12,
    ...cardShadow(C),
  },
  deliveryCardActive: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  deliveryCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deliveryCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#BEB3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: C.primary },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.primary },
  deliveryCardTitle: { fontSize: 15, fontWeight: '700', color: C.textSoft },
  deliveryCardTitleActive: { color: C.primary },
  deliveryCardSub: { fontSize: 12, color: C.textFaint, marginTop: 2 },

  savingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.successFaint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  savingBadgeText: { fontSize: 11, fontWeight: '700', color: C.success },

  urgentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.warningFaint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  urgentBadgeText: { fontSize: 11, fontWeight: '700', color: '#E67E22' },

  slotRow: { flexDirection: 'row', gap: 10 },
  slotBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  slotBtnActive: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  slotText: { fontSize: 13, fontWeight: '600', color: C.textFaint },
  slotTextActive: { color: C.primary },

  // Resumen
  summaryBox: {
    backgroundColor: C.surface, borderRadius: 18, padding: 18, gap: 12,
    ...cardShadow(C),
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabelRow: { flexDirection: 'column', gap: 4, flex: 1, marginRight: 8 },
  summaryLabel: { fontSize: 14, color: C.textSoft },
  summaryValue: { fontSize: 14, fontWeight: '700', color: C.text },
  summaryPending: { fontSize: 13, color: '#BEB3E0', fontStyle: 'italic' },
  vehicleChip: {
    alignSelf: 'flex-start', backgroundColor: C.primaryFaint,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  vehicleChipText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.primary },
  totalNote: { fontSize: 11, color: '#BEB3E0', fontStyle: 'italic', textAlign: 'center' },

  // Botón confirmar
  confirmBtn: {
    backgroundColor: C.success, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18,
    ...floatingShadow(C, C.success),
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  confirmBtnDisabled: {
    backgroundColor: '#BEB3E0',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(20,10,50,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: C.surface, borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center', gap: 14,
    ...floatingShadow(C),
  },
  modalIconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  modalBody: { fontSize: 14, color: C.textSoft, textAlign: 'center', lineHeight: 21 },
  modalPrimaryBtn: {
    backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14,
    width: '100%', marginTop: 4,
  },
  modalPrimaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalSecondaryBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  modalSecondaryBtnText: { fontSize: 15, color: C.textFaint, fontWeight: '600' },
});

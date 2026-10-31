import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/types';
import { useCartStore, CartItem } from '../store/cartStore';
import { useProductsStore } from '../store/productsStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { cardShadow, floatingShadow } from '../theme/elevation';

const MANAGEMENT_FEE = 0.07;
const MINIMUM_ORDER  = 15;

type CarritoNav = StackNavigationProp<HomeStackParamList, 'Carrito'>;

export default function CarritoScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation    = useNavigation<CarritoNav>();
  const { items, updateQuantity, removeItem } = useCartStore();
  const products = useProductsStore(s => s.products);

  const subtotal    = items.reduce((s, i) => s + i.presentationPrice * i.quantity, 0);
  const gestion     = subtotal * MANAGEMENT_FEE;
  const total       = subtotal + gestion;
  const belowMin    = total > 0 && total < MINIMUM_ORDER;

  function handlePay() {
    navigation.navigate('Checkout');
  }

  // ── Fila de producto ────────────────────────────────────────────────────────

  function renderItem({ item }: { item: CartItem }) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    return (
      <View style={styles.row}>
        <Image
          source={{ uri: product.image }}
          style={styles.rowImage}
          resizeMode="cover"
        />

        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.rowPresentation}>{item.presentationLabel}</Text>
          <Text style={styles.rowPrice}>
            ${(item.presentationPrice * item.quantity).toFixed(2)}
          </Text>
        </View>

        <View style={styles.rowActions}>
          {/* Botón eliminar */}
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.7}
            onPress={() => removeItem(item.productId, item.presentationIndex)}
          >
            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
          </TouchableOpacity>

          {/* Selector cantidad */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              activeOpacity={0.7}
              onPress={() => updateQuantity(item.productId, item.presentationIndex, -1)}
            >
              <Ionicons name="remove" size={16} color={C.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              activeOpacity={0.7}
              onPress={() => updateQuantity(item.productId, item.presentationIndex, 1)}
            >
              <Ionicons name="add" size={16} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Estado vacío ─────────────────────────────────────────────────────────────

  function renderEmpty() {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={72} color="#D4C9F5" />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>Agregá productos desde el catálogo</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.emptyBtnText}>Explorar catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      {/* ── Header ── */}
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi carrito</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      {/* ── Lista ── */}
      <FlatList
        data={items}
        keyExtractor={i => `${i.productId}__${i.presentationIndex}`}
        contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.summary}>

              {/* ── Resumen ── */}
              <Text style={styles.summaryTitle}>Resumen del pedido</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Costo de gestión (7%)</Text>
                <Text style={styles.summaryValue}>${gestion.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transporte</Text>
                <Text style={styles.summaryTransport}>
                  Se calculará según tu dirección
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>

              {/* ── Advertencia pedido mínimo ── */}
              {belowMin && (
                <View style={styles.minWarning}>
                  <Ionicons name="warning-outline" size={18} color="#E74C3C" />
                  <Text style={styles.minWarningText}>
                    Pedido mínimo ${MINIMUM_ORDER.toFixed(2)}. Te faltan $
                    {(MINIMUM_ORDER - total).toFixed(2)} para continuar.
                  </Text>
                </View>
              )}

              {/* ── Botón pagar ── */}
              <TouchableOpacity
                style={[styles.payBtn, belowMin && styles.payBtnDisabled]}
                activeOpacity={belowMin ? 1 : 0.85}
                onPress={belowMin ? undefined : handlePay}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                <Text style={styles.payBtnText}>Ir a pagar</Text>
              </TouchableOpacity>

            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.headerGradient[0],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Lista
  list: {
    backgroundColor: C.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },

  // Fila de producto
  row: {
    backgroundColor: C.surface,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    ...cardShadow(C),
  },
  rowImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: C.primaryFaint,
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    lineHeight: 19,
  },
  rowPresentation: {
    fontSize: 12,
    color: C.textFaint,
    fontWeight: '500',
  },
  rowPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  rowActions: {
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.dangerFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryFaint,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.primary,
    minWidth: 20,
    textAlign: 'center',
  },

  // Resumen
  summary: {
    marginTop: 8,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    ...cardShadow(C),
    gap: 12,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: C.textSoft,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  summaryTransport: {
    fontSize: 12,
    color: C.textFaint,
    fontStyle: 'italic',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
  },

  // Advertencia pedido mínimo
  minWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.dangerFaint,
    borderRadius: 12,
    padding: 12,
  },
  minWarningText: {
    flex: 1,
    fontSize: 13,
    color: C.danger,
    lineHeight: 19,
    fontWeight: '600',
  },

  // Botón pagar
  payBtn: {
    backgroundColor: C.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    marginTop: 4,
    ...floatingShadow(C, C.success),
  },
  payBtnDisabled: {
    backgroundColor: '#BEB3E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // Vacío
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textFaint,
  },
  emptyText: {
    fontSize: 14,
    color: C.textFaint,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

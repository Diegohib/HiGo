import {
  useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { useProductsStore } from '../store/productsStore';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { cardShadow, floatingShadow } from '../theme/elevation';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Product'>;
  route: RouteProp<HomeStackParamList, 'Product'>;
};

export default function ProductScreen({ navigation, route }: Props) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const products = useProductsStore(s => s.products);
  const product = products.find(p => p.id === route.params.productId);
  const [selectedPresentation, setSelectedPresentation] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);
  const isFavorite = useFavoritesStore(s => product ? s.productIds.includes(product.id) : false);
  const toggleFavorite = useFavoritesStore(s => s.toggleFavorite);

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, styles.notFound]}>
        <Ionicons name="alert-circle-outline" size={48} color="#9B8EC4" />
        <Text style={styles.notFoundText}>No se encontró este producto.</Text>
        <TouchableOpacity style={styles.notFoundBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.notFoundBtnText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentPresentation = product.presentations[selectedPresentation];
  const totalPrice = (currentPresentation.price * quantity).toFixed(2);

  function increment() { setQuantity(q => q + 1); }
  function decrement() { setQuantity(q => Math.max(1, q - 1)); }

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      presentationIndex: selectedPresentation,
      presentationLabel: currentPresentation.label,
      presentationPrice: currentPresentation.price,
      quantity,
    });
    Alert.alert(
      'Agregado al carrito',
      `${product!.name} (${currentPresentation.label}) x${quantity}`,
      [
        { text: 'Seguir comprando', style: 'cancel' },
        { text: 'Ver carrito', onPress: () => navigation.navigate('Carrito') },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Imagen / Hero ── */}
        <View style={styles.hero}>
          <Image source={{ uri: product.image }} style={styles.heroImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.favoriteBtn}
            activeOpacity={0.75}
            onPress={() => toggleFavorite(product.id)}
          >
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? C.danger : C.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Contenido ── */}
        <View style={styles.content}>

          {/* Nombre y subcategoría */}
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productSubcat}>{product.subcategory}</Text>
            </View>
            <View style={styles.subcatBadge}>
              <Text style={styles.subcatBadgeText}>{product.subcategory}</Text>
            </View>
          </View>

          {/* Descripción */}
          <Text style={styles.description}>{product.description}</Text>

          {/* ── Selector de presentación ── */}
          <Text style={styles.sectionLabel}>Presentación</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {product.presentations.map((pres, i) => {
              const active = selectedPresentation === i;
              return (
                <TouchableOpacity
                  key={pres.label}
                  style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                  onPress={() => { setSelectedPresentation(i); setQuantity(1); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {pres.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Precio ── */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Precio por {currentPresentation.label}</Text>
              <Text style={styles.priceValue}>${currentPresentation.price.toFixed(2)}</Text>
            </View>
            <View style={styles.qtySelector}>
              <TouchableOpacity style={styles.qtyBtn} onPress={decrement} activeOpacity={0.7}>
                <Ionicons name="remove" size={18} color={C.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={increment} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice}</Text>
          </View>

          {/* ── Botón agregar al carrito ── */}
          {product.agotado ? (
            <View style={[styles.cartButton, styles.cartButtonDisabled]}>
              <Ionicons name="close-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.cartButtonText}>Agotado por hoy</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.cartButton} activeOpacity={0.85} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
              <Text style={styles.cartButtonText}>Agregar al carrito</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },

  // No encontrado
  notFound: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  notFoundText: {
    fontSize: 15,
    color: C.textSoft,
    textAlign: 'center',
  },
  notFoundBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  notFoundBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Hero
  hero: {
    height: 260,
    backgroundColor: C.surfaceAlt,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  // Contenido
  content: {
    backgroundColor: C.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 40,
  },

  // Nombre
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  nameBlock: { flex: 1 },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  productSubcat: {
    fontSize: 14,
    color: C.textFaint,
    marginTop: 2,
  },
  subcatBadge: {
    backgroundColor: C.primaryFaint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  subcatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },

  // Descripción
  description: {
    fontSize: 14,
    color: C.textSoft,
    lineHeight: 22,
    marginBottom: 24,
  },

  // Presentación
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  pillsRow: {
    gap: 10,
    marginBottom: 24,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  pillActive: {
    backgroundColor: C.primary,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // Precio y cantidad
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 13,
    color: C.textFaint,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: C.primary,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.primaryFaint,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
    minWidth: 24,
    textAlign: 'center',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    ...cardShadow(C),
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textSoft,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
  },

  // Botón carrito
  cartButton: {
    backgroundColor: C.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    ...floatingShadow(C, C.success),
  },
  cartButtonDisabled: {
    backgroundColor: C.textFaint,
    shadowOpacity: 0,
    elevation: 0,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

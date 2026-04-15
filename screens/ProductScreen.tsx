import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { PRODUCTS } from '../data/products';
import { useCartStore } from '../store/cartStore';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Product'>;
  route: RouteProp<HomeStackParamList, 'Product'>;
};

export default function ProductScreen({ navigation, route }: Props) {
  const product = PRODUCTS.find(p => p.id === route.params.productId)!;
  const [selectedPresentation, setSelectedPresentation] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);

  const currentPresentation = product.presentations[selectedPresentation];
  const totalPrice = (currentPresentation.price * quantity).toFixed(2);

  function increment() { setQuantity(q => q + 1); }
  function decrement() { setQuantity(q => Math.max(1, q - 1)); }

  function handleAddToCart() {
    addItem({
      productId: product.id,
      presentationIndex: selectedPresentation,
      presentationLabel: currentPresentation.label,
      presentationPrice: currentPresentation.price,
      quantity,
    });
    Alert.alert(
      'Agregado al carrito',
      `${product.name} (${currentPresentation.label}) x${quantity}`,
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
        <View style={[styles.hero, { backgroundColor: product.emojiColor }]}>
          <Text style={styles.heroEmoji}>{product.emoji}</Text>
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
                <Ionicons name="remove" size={18} color="#3D1F8B" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={increment} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color="#3D1F8B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice}</Text>
          </View>

          {/* ── Botón agregar al carrito ── */}
          <TouchableOpacity style={styles.cartButton} activeOpacity={0.85} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
            <Text style={styles.cartButtonText}>Agregar al carrito</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F5FF',
  },

  // Hero
  hero: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 100,
  },

  // Contenido
  content: {
    backgroundColor: '#F7F5FF',
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
    color: '#1A1A1A',
    lineHeight: 30,
  },
  productSubcat: {
    fontSize: 14,
    color: '#9B8EC4',
    marginTop: 2,
  },
  subcatBadge: {
    backgroundColor: '#EDE7F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  subcatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D1F8B',
  },

  // Descripción
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
  },

  // Presentación
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
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
    backgroundColor: '#3D1F8B',
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#3D1F8B',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D1F8B',
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
    color: '#9B8EC4',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2ECC71',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EDE7F6',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3D1F8B',
    minWidth: 24,
    textAlign: 'center',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D1F8B',
  },

  // Botón carrito
  cartButton: {
    backgroundColor: '#2ECC71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

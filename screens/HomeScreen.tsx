import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: '1', name: 'Frutas',     emoji: '🍎', bg: '#2D7A3A' },
  { id: '2', name: 'Verduras',   emoji: '🥦', bg: '#388E3C' },
  { id: '3', name: 'Hortalizas', emoji: '🥕', bg: '#558B2F' },
  { id: '4', name: 'Huevos',     emoji: '🥚', bg: '#F57F17' },
];

const OFFERS = [
  { id: '1', name: 'Tomates perita',  unit: 'x kg',  price: '$850',  badge: '15% OFF' },
  { id: '2', name: 'Papa blanca',     unit: 'x 10kg', price: '$4.200', badge: '10% OFF' },
  { id: '3', name: 'Cebolla blanca',  unit: 'x kg',  price: '$620',  badge: '20% OFF' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3D1F8B" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>HiGo</Text>
        <TouchableOpacity style={styles.cartButton} activeOpacity={0.7}>
          <Ionicons name="cart-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Barra de búsqueda ── */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#9B8EC4" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tomates, papas, cebollas..."
            placeholderTextColor="#9B8EC4"
          />
        </View>

        {/* ── Categorías ── */}
        <Text style={styles.sectionTitle}>Categorías</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: cat.bg }]}
              activeOpacity={0.82}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Repetir último pedido ── */}
        <TouchableOpacity style={styles.repeatButton} activeOpacity={0.85}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          <Text style={styles.repeatButtonText}>Repetir último pedido</Text>
        </TouchableOpacity>

        {/* ── Ofertas del día ── */}
        <Text style={styles.sectionTitle}>Ofertas del día</Text>
        <View style={styles.offersColumn}>
          {OFFERS.map((offer) => (
            <TouchableOpacity key={offer.id} style={styles.offerCard} activeOpacity={0.8}>
              <View style={styles.offerInfo}>
                <Text style={styles.offerName}>{offer.name}</Text>
                <Text style={styles.offerUnit}>{offer.unit}</Text>
              </View>
              <View style={styles.offerRight}>
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>{offer.badge}</Text>
                </View>
                <Text style={styles.offerPrice}>{offer.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#3D1F8B',
  },

  // Header
  header: {
    backgroundColor: '#3D1F8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cartButton: {
    width: 36,
    alignItems: 'flex-end',
  },

  // Scroll
  scroll: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // Búsqueda
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Sección
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },

  // Grid categorías
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47.5%',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 40,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Botón repetir pedido
  repeatButton: {
    backgroundColor: '#3D1F8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 28,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  repeatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Ofertas
  offersColumn: {
    gap: 12,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  offerInfo: {
    gap: 4,
  },
  offerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  offerUnit: {
    fontSize: 12,
    color: '#9B8EC4',
  },
  offerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  offerBadge: {
    backgroundColor: '#2ECC71',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3D1F8B',
  },
});

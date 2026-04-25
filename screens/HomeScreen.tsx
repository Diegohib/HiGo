import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeStackParamList, RootStackParamList, TabParamList } from '../navigation/types';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

type Props = {
  navigation: CompositeNavigationProp<
    StackNavigationProp<HomeStackParamList, 'Home'>,
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList>,
      StackNavigationProp<RootStackParamList>
    >
  >;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, IoniconName> = {
  tuberculos: 'nutrition-outline',
  frutas:     'leaf-outline',
  verduras:   'flower-outline',
  abarrotes:  'basket-outline',
};

const CARD_WIDTH = (Dimensions.get('window').width - 18 * 2 - 12) / 2;

const BESTSELLERS = PRODUCTS.slice(0, 3);

export default function HomeScreen({ navigation }: Props) {
  const totalItems = useCartStore(s => s.totalItems);
  const user       = useAuthStore(s => s.user);

  const greeting = user?.name
    ? `Hola, ${user.name.split(' ')[0]} 👋`
    : 'Bienvenido a HiGo';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3D1F8B" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Splash')}
        >
          <Ionicons name="home-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>HiGo</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Carrito')}
        >
          <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Saludo ── */}
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.greetingSub}>¿Qué vas a pedir hoy?</Text>

        {/* ── Búsqueda ── */}
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
          {CATEGORIES.map((cat) => {
            const icon = CATEGORY_ICONS[cat.id] ?? 'grid-outline';
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: cat.color }]}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Catalog', {
                  categoryId:    cat.id,
                  categoryName:  cat.name,
                  categoryEmoji: cat.emoji,
                  categoryColor: cat.color,
                })}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={icon} size={30} color="#FFFFFF" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Más vendidos ── */}
        <Text style={styles.sectionTitle}>Más vendidos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bestsellersRow}
        >
          {BESTSELLERS.map((product) => {
            const base = product.presentations[0];
            const cat  = CATEGORIES.find(c => c.id === product.categoryId);
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Product', { productId: product.id })}
              >
                <View style={[styles.productIconBox, { backgroundColor: cat?.color ?? '#3D1F8B' }]}>
                  <Text style={styles.productEmoji}>{product.emoji}</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  ${base.price.toFixed(2)}
                  <Text style={styles.productUnit}> / {base.label}</Text>
                </Text>
                <View style={styles.addBtn}>
                  <Ionicons name="add" size={18} color="#3D1F8B" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Banner horarios ── */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="time-outline" size={28} color="#3D1F8B" />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Horarios de entrega</Text>
            <View style={styles.bannerSlots}>
              <View style={styles.slot}>
                <Ionicons name="sunny-outline" size={14} color="#3D1F8B" />
                <Text style={styles.slotText}>10:00 – 12:00</Text>
              </View>
              <View style={styles.slotDivider} />
              <View style={styles.slot}>
                <Ionicons name="partly-sunny-outline" size={14} color="#3D1F8B" />
                <Text style={styles.slotText}>14:00 – 16:00</Text>
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: '#3D1F8B',
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
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#3D1F8B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
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
    paddingTop: 22,
    paddingBottom: 48,
  },

  // Saludo
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 14,
    color: '#9B8EC4',
    marginBottom: 20,
  },

  // Búsqueda
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Sección title
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
    marginBottom: 28,
  },
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Más vendidos
  bestsellersRow: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 28,
  },
  productCard: {
    width: 148,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productIconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  productEmoji: {
    fontSize: 32,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2ECC71',
  },
  productUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9B8EC4',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Banner horarios
  banner: {
    backgroundColor: '#EDE7F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#D4C9F5',
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    gap: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D1F8B',
  },
  bannerSlots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D1F8B',
  },
  slotDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#C4B5F0',
  },
});

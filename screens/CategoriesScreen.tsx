import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { CatalogStackParamList } from '../navigation/types';
import { CATEGORIES } from '../data/products';
import { useCartStore } from '../store/cartStore';

type Props = {
  navigation: StackNavigationProp<CatalogStackParamList, 'Categories'>;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, IoniconName> = {
  tuberculos: 'nutrition-outline',
  frutas:     'leaf-outline',
  verduras:   'flower-outline',
  abarrotes:  'basket-outline',
};

const CARD_WIDTH = (Dimensions.get('window').width - 18 * 2 - 14) / 2;

export default function CategoriesScreen({ navigation }: Props) {
  const totalItems = useCartStore(s => s.totalItems);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3D1F8B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Categorías</Text>
        <TouchableOpacity
          style={styles.cartButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Carrito')}
        >
          <Ionicons name="cart-outline" size={26} color="#FFFFFF" />
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
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const icon = CATEGORY_ICONS[cat.id] ?? 'grid-outline';
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.card, { backgroundColor: cat.color }]}
                activeOpacity={0.83}
                onPress={() => navigation.navigate('Catalog', {
                  categoryId:    cat.id,
                  categoryName:  cat.name,
                  categoryEmoji: cat.emoji,
                  categoryColor: cat.color,
                })}
              >
                {/* Círculo de fondo para el icono */}
                <View style={styles.iconCircle}>
                  <Ionicons name={icon} size={40} color="#FFFFFF" />
                </View>

                <Text style={styles.cardName}>{cat.name}</Text>

                {/* Flecha indicadora */}
                <View style={styles.arrowBadge}>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          })}
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

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#3D1F8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerSpacer: { width: 36 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cartButton: {
    width: 36,
    alignItems: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#3D1F8B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 48,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },

  // ── Tarjeta ───────────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  arrowBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

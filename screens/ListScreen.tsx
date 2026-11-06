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
import { Product } from '../data/products';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import { useProductsStore } from '../store/productsStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { cardShadow } from '../theme/elevation';

export default function ListScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const productIds      = useFavoritesStore(s => s.productIds);
  const toggleFavorite  = useFavoritesStore(s => s.toggleFavorite);
  const addItem         = useCartStore(s => s.addItem);
  const products         = useProductsStore(s => s.products);

  const favorites = products.filter(p => productIds.includes(p.id));

  function handleAddToCart(product: Product) {
    const base = product.presentations[0];
    addItem({
      productId: product.id,
      presentationIndex: 0,
      presentationLabel: base.label,
      presentationPrice: base.price,
    });
  }

  function renderItem({ item }: { item: Product }) {
    const base = item.presentations[0];
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {item.agotado ? (
            <Text style={[styles.price, { color: C.danger }]}>Agotado por hoy</Text>
          ) : (
            <Text style={styles.price}>
              ${base.price.toFixed(2)}
              <Text style={styles.unit}> / {base.label}</Text>
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.removeBtn}
            activeOpacity={0.7}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons name="heart" size={18} color="#E74C3C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.75}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="cart-outline" size={18} color={C.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Ionicons name="heart" size={20} color="#FFFFFF" style={{ marginBottom: 2 }} />
        <Text style={styles.headerTitle}>Mi Lista</Text>
      </LinearGradient>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, favorites.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color="#D4C9F5" />
            <Text style={styles.emptyTitle}>Todavía no tienes favoritos</Text>
            <Text style={styles.emptyText}>
              Toca el corazón en cualquier producto del catálogo para guardarlo acá
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.headerGradient[0],
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

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

  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    ...cardShadow(C),
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: C.primaryFaint,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    lineHeight: 19,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: C.primary,
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
    color: C.textFaint,
  },
  actions: {
    gap: 8,
  },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.dangerFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
    textAlign: 'center',
    lineHeight: 20,
  },
});

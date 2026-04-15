import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CatalogStackParamList } from '../navigation/types';
import { PRODUCTS, CATEGORIES, Product } from '../data/products';
import { useCartStore } from '../store/cartStore';

type CatalogNav   = StackNavigationProp<CatalogStackParamList, 'Catalog'>;
type CatalogRoute = RouteProp<CatalogStackParamList, 'Catalog'>;

export default function CatalogScreen() {
  const navigation = useNavigation<CatalogNav>();
  const route      = useRoute<CatalogRoute>();

  const categoryId   = route.params?.categoryId;
  const categoryName = route.params?.categoryName;
  const isFiltered   = Boolean(categoryId);

  const [search, setSearch]         = useState('');
  const [activePill, setActivePill] = useState(0);
  const totalItems = useCartStore(s => s.totalItems);

  // ── Fuente de productos ──────────────────────────────────────────────────────
  const baseProducts = useMemo(
    () => isFiltered ? PRODUCTS.filter(p => p.categoryId === categoryId) : PRODUCTS,
    [isFiltered, categoryId],
  );

  // ── Pills ────────────────────────────────────────────────────────────────────
  // Filtrado por categoría → subcategorías únicas
  // Catálogo general     → nombres de categoría
  const pills = useMemo(() => {
    if (isFiltered) {
      const unique = Array.from(new Set(baseProducts.map(p => p.subcategory)));
      return unique.length > 1 ? ['Todos', ...unique] : [];
    }
    return ['Todos', ...CATEGORIES.map(c => c.name)];
  }, [isFiltered, baseProducts]);

  // ── Lista filtrada ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = baseProducts;

    if (activePill > 0) {
      if (isFiltered) {
        // modo categoría: filtrar por subcategoría
        list = list.filter(p => p.subcategory === pills[activePill]);
      } else {
        // modo general: filtrar por nombre de categoría
        const cat = CATEGORIES.find(c => c.name === pills[activePill]);
        if (cat) list = list.filter(p => p.categoryId === cat.id);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [baseProducts, activePill, pills, isFiltered, search]);

  // ── Tarjeta ──────────────────────────────────────────────────────────────────

  function renderProduct({ item }: { item: Product }) {
    const base = item.presentations[0];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('Product', { productId: item.id })}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          {!isFiltered && (
            <Text style={styles.cardCategory}>
              {CATEGORIES.find(c => c.id === item.categoryId)?.name}
            </Text>
          )}
          <Text style={styles.cardPrice}>
            ${base.price.toFixed(2)}
            <Text style={styles.cardUnit}> / {base.label}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Product', { productId: item.id })}
        >
          <Ionicons name="add" size={22} color="#3D1F8B" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3D1F8B" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {isFiltered ? (
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}

        <Text style={styles.headerTitle} numberOfLines={1}>
          {isFiltered ? categoryName : 'Catálogo'}
        </Text>

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

      {/* ── Contenido ── */}
      <View style={styles.content}>

        {/* Búsqueda */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#9B8EC4" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isFiltered ? 'Buscar productos...' : 'Buscar en todo el catálogo...'}
            placeholderTextColor="#9B8EC4"
            value={search}
            onChangeText={text => { setSearch(text); setActivePill(0); }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#9B8EC4" />
            </TouchableOpacity>
          )}
        </View>

        {/* Pills */}
        {pills.length > 0 && (
          <View style={styles.pillsRow}>
            {pills.map((pill, i) => (
              <TouchableOpacity
                key={pill}
                style={[styles.pill, activePill === i && styles.pillActive]}
                onPress={() => setActivePill(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, activePill === i && styles.pillTextActive]}>
                  {pill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Lista */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color="#D4C9F5" />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Intentá con otro término</Text>
            </View>
          }
          renderItem={renderProduct}
        />
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3D1F8B',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 12,
  },

  // Área de contenido
  content: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Búsqueda
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3D1F8B',
  },
  pillActive: {
    backgroundColor: '#3D1F8B',
    borderColor: '#3D1F8B',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D1F8B',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // Lista
  list: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 36,
    gap: 12,
  },

  // Tarjeta
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0EEFF',
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9B8EC4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2ECC71',
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9B8EC4',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Vacío
  empty: {
    paddingTop: 64,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9B8EC4',
  },
  emptyText: {
    fontSize: 13,
    color: '#BEB3E0',
  },
});

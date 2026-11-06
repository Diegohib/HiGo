import {
  useMemo,
  useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { Product, Category } from '../data/products';
import { useProductsStore, useDisplayCategories } from '../store/productsStore';
import { useCartStore } from '../store/cartStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { cardShadow } from '../theme/elevation';
import { getCategoryIcon } from '../theme/categoryIcons';

type CatalogNav   = StackNavigationProp<HomeStackParamList, 'Catalog'>;
type CatalogRoute = RouteProp<HomeStackParamList, 'Catalog'>;

export default function CatalogScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<CatalogNav>();
  const route      = useRoute<CatalogRoute>();

  const categoryId   = route.params?.categoryId;
  const categoryName = route.params?.categoryName;
  const isFiltered   = Boolean(categoryId);

  const [search, setSearch]         = useState(route.params?.initialSearch ?? '');
  const [activePill, setActivePill] = useState(0);
  const totalItems = useCartStore(s => s.totalItems);
  const products   = useProductsStore(s => s.products);
  const categories = useDisplayCategories();

  // ── Fuente de productos ──────────────────────────────────────────────────────
  const baseProducts = useMemo(
    () => isFiltered ? products.filter(p => p.categoryId === categoryId) : products,
    [isFiltered, categoryId, products],
  );

  // ── Pills de subcategoría ────────────────────────────────────────────────────
  const pills = useMemo(() => {
    if (isFiltered) {
      const unique = Array.from(new Set(baseProducts.map(p => p.subcategory)));
      return unique.length > 1 ? ['Todos', ...unique] : [];
    }
    return ['Todos', ...categories.map(c => c.name)];
  }, [isFiltered, baseProducts, categories]);

  // ── Lista filtrada ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = baseProducts;

    if (activePill > 0) {
      if (isFiltered) {
        list = list.filter(p => p.subcategory === pills[activePill]);
      } else {
        const cat = categories.find(c => c.name === pills[activePill]);
        if (cat) list = list.filter(p => p.categoryId === cat.id);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [baseProducts, activePill, pills, isFiltered, search, categories]);

  const sectionTitle = pills.length > 0 && activePill > 0
    ? pills[activePill]
    : (categoryName ?? 'Catálogo');

  // ── Cambiar de categoría desde la tira de arriba ─────────────────────────────
  function switchCategory(cat: Category) {
    setActivePill(0);
    setSearch('');
    navigation.setParams({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryEmoji: cat.emoji,
      categoryColor: cat.color,
    });
  }

  // ── Tarjeta de producto ───────────────────────────────────────────────────────

  function renderProduct({ item }: { item: Product }) {
    const base = item.presentations[0];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Product', { productId: item.id })}
      >
        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Product', { productId: item.id })}
          >
            <Ionicons name="add" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        {!isFiltered && (
          <Text style={styles.cardCategory}>
            {categories.find(c => c.id === item.categoryId)?.name}
          </Text>
        )}
        {item.agotado ? (
          <Text style={[styles.cardPrice, { color: C.danger }]}>Agotado por hoy</Text>
        ) : (
          <Text style={styles.cardPrice}>
            ${base.price.toFixed(2)}
            <Text style={styles.cardUnit}> / {base.label}</Text>
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      {/* ── Buscar ── */}
      <View style={styles.searchRow}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={C.textFaint} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isFiltered ? `Buscar en ${categoryName}...` : 'Buscar en el catálogo...'}
            placeholderTextColor={C.textFaint}
            value={search}
            onChangeText={text => { setSearch(text); setActivePill(0); }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={C.textFaint} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Carrito')}>
          <Ionicons name="cart-outline" size={22} color={C.text} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Tira de categorías: solo al ver una categoría puntual, para saltar
           a otra sin volver atrás. En "Todos" ya está la fila de tabs de abajo
           con las mismas categorías — mostrar ambas era redundante. ── */}
      {isFiltered && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryStrip}
          contentContainerStyle={styles.categoryStripContent}
        >
          {categories.map((cat) => {
            const active = cat.id === categoryId;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryStripItem}
                activeOpacity={0.8}
                onPress={() => switchCategory(cat)}
              >
                <View style={[styles.categoryStripCircle, { backgroundColor: cat.color + '1E' }, active && styles.categoryStripCircleActive]}>
                  <MaterialCommunityIcons name={getCategoryIcon(cat.id)} size={24} color={cat.color} />
                </View>
                <Text
                  style={[styles.categoryStripLabel, active && styles.categoryStripLabelActive]}
                  numberOfLines={2}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Tabs de subcategoría ── */}
      {pills.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
          contentContainerStyle={styles.tabsRowContent}
        >
          {pills.map((pill, i) => {
            const active = activePill === i;
            return (
              <TouchableOpacity
                key={pill}
                style={[styles.tabItem, active && styles.tabItemActive]}
                activeOpacity={0.7}
                onPress={() => setActivePill(i)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{pill}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Lista ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            <Text style={styles.sectionCount}>{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</Text>
          </View>
        }
        ListEmptyComponent={
          search.trim().length === 0 ? (
            // No es que la búsqueda no encontró nada — todavía no hay
            // productos cargados en esta categoría (o en el catálogo entero).
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={44} color="#D4C9F5" />
              <Text style={styles.emptyTitle}>Muy pronto</Text>
              <Text style={styles.emptyText}>
                Estamos subiendo los productos{isFiltered ? ` de ${categoryName}` : ''}. ¡Vuelve pronto!
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color="#D4C9F5" />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Intenta con otro término</Text>
            </View>
          )
        }
        renderItem={renderProduct}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },

  // Buscar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow(C),
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },

  // Tira de categorías
  categoryStrip: {
    flexGrow: 0,
  },
  categoryStripContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  categoryStripItem: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  categoryStripCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryStripCircleActive: {
    borderWidth: 2.5,
    borderColor: C.primary,
  },
  categoryStripLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryStripLabelActive: {
    color: C.text,
    fontWeight: '800',
  },

  // Subcategorías: chips (antes eran pestañas subrayadas que en algunas
  // pantallas quedaban cortadas por arriba).
  tabsRow: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsRowContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  tabItemActive: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: C.textSoft,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Encabezado de sección
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    color: C.textFaint,
    marginTop: 2,
  },

  // Lista / grid
  list: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  row: {
    gap: 12,
    marginBottom: 14,
  },

  // Tarjeta de producto
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 10,
    gap: 6,
    ...cardShadow(C),
  },
  cardImageWrapper: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    backgroundColor: C.primaryFaint,
  },
  addBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    lineHeight: 18,
    minHeight: 36,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: C.primary,
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: C.textFaint,
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
    color: C.textFaint,
  },
  emptyText: {
    fontSize: 13,
    color: C.textFaint,
  },
});

import {
  useState,
  useEffect,
  useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeStackParamList, RootStackParamList, TabParamList } from '../navigation/types';
import { useProductsStore, useDisplayCategories } from '../store/productsStore';
import { Category, Product } from '../data/products';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS, SPACING, cardShadow, floatingShadow } from '../theme/elevation';
import { getCategoryIcon } from '../theme/categoryIcons';
import Avatar from '../components/Avatar';
import HiGoLogo from '../components/HiGoLogo';

type Props = {
  navigation: CompositeNavigationProp<
    StackNavigationProp<HomeStackParamList, 'Home'>,
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList>,
      StackNavigationProp<RootStackParamList>
    >
  >;
};

const FEATURED_COUNT = 8;

function greetingPrefix(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen({ navigation }: Props) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const totalItems = useCartStore(s => s.totalItems);
  const cartTotal   = useCartStore(s => s.items.reduce((sum, i) => sum + i.presentationPrice * i.quantity, 0));
  const user        = useAuthStore(s => s.user);
  const categories  = useDisplayCategories();
  const products    = useProductsStore(s => s.products);
  const [search, setSearch] = useState('');

  const greeting = user?.name
    ? `${greetingPrefix()}, ${user.name.split(' ')[0]}`
    : greetingPrefix();

  const featured = products.slice(0, FEATURED_COUNT);

  // Al cliente nuevo se le pide la dirección una sola vez por sesión de la
  // app (se puede omitir); si ya la tiene guardada o ya la saltó, no se
  // vuelve a interrumpir.
  const promptedAddressRef = useRef(false);
  useEffect(() => {
    if (promptedAddressRef.current) return;
    if (!user || user.role !== 'cliente') return;
    if (user.address || user.addressSkipped) return;
    promptedAddressRef.current = true;
    navigation.navigate('AddressSetup', {});
  }, [user]);

  function openCategory(cat: Category) {
    navigation.navigate('Catalog', {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryEmoji: cat.emoji,
      categoryColor: cat.color,
    });
  }

  function openProduct(product: Product) {
    navigation.navigate('Product', { productId: product.id });
  }

  function openFullCatalog() {
    navigation.navigate('Catalog', {});
  }

  // Al buscar desde Inicio, los resultados se muestran en el catálogo general.
  function handleSearchSubmit() {
    const q = search.trim();
    if (q) navigation.navigate('Catalog', { initialSearch: q });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      {/* ── Header ── */}
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <HiGoLogo size={34} color="#FFFFFF" />
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Cuenta')}
            >
              <Avatar name={user?.name} photoUri={user?.photoUri} size={38} bg="rgba(255,255,255,0.2)" textColor="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Carrito')}
            >
              <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.greetingSub}>¿Qué vas a pedir hoy?</Text>
      </LinearGradient>

      {/* ── Búsqueda flotante (a caballo entre el header y el contenido) ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchIconBox}>
          <Ionicons name="search-outline" size={16} color={C.primary} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tomates, papas, cebollas..."
          placeholderTextColor={C.textFaint}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={C.textFaint} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, totalItems > 0 && { paddingBottom: 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: horarios de entrega, con más presencia gráfica ── */}
        <LinearGradient
          colors={[C.headerGradient[1], C.headerGradient[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBlob} pointerEvents="none" />
          <Ionicons
            name="basket"
            size={116}
            color="rgba(255,255,255,0.14)"
            style={styles.heroIconGhost}
          />
          <View style={styles.heroIconBox}>
            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Horarios de entrega</Text>
          <View style={styles.heroSlots}>
            <View style={styles.slotPill}>
              <Ionicons name="sunny-outline" size={13} color="#FFFFFF" />
              <Text style={styles.slotText}>10:00 – 12:00</Text>
            </View>
            <View style={styles.slotPill}>
              <Ionicons name="partly-sunny-outline" size={13} color="#FFFFFF" />
              <Text style={styles.slotText}>14:00 – 16:00</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Categorías: tarjeta clara + ícono + nombre, estilo apps de
             delivery (PedidosYa, Rappi) — sin foto ni degradado: son livianas,
             no dependen de que cargue nada por red, y se ven bien desde el
             primer segundo aunque el catálogo todavía no tenga fotos reales. ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <Pressable onPress={openFullCatalog}>
            <Text style={styles.sectionLink}>Ver todo</Text>
          </Pressable>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryTile}
              activeOpacity={0.8}
              onPress={() => openCategory(cat)}
            >
              <View style={[styles.categoryTileIconWrap, { backgroundColor: cat.color + '1E' }]}>
                <MaterialCommunityIcons name={getCategoryIcon(cat.id)} size={28} color={cat.color} />
              </View>
              <Text style={styles.categoryTileName} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Destacados: grilla 2 columnas, más productos de un vistazo ──
             La sección siempre se muestra (con un aviso si todavía no hay
             productos) — que desapareciera del todo dejaba la pantalla de
             inicio con una sensación de "vacío" apenas se abría la app. ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destacados</Text>
          <Pressable onPress={openFullCatalog}>
            <Text style={styles.sectionLink}>Ver todo</Text>
          </Pressable>
        </View>
        {featured.length === 0 ? (
          <View style={styles.comingSoonCard}>
            <Ionicons name="storefront-outline" size={30} color={C.primary} />
            <Text style={styles.comingSoonTitle}>Muy pronto</Text>
            <Text style={styles.comingSoonText}>
              Estamos subiendo los productos del mercado. ¡Vuelve pronto!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.productGrid}>
              {featured.map((product) => {
                const base = product.presentations[0];
                const cat = categories.find((c) => c.id === product.categoryId);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    activeOpacity={0.85}
                    onPress={() => openProduct(product)}
                  >
                    <View style={styles.productImageWrapper}>
                      <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                      {cat && (
                        <View style={[styles.productTag, { backgroundColor: cat.color }]}>
                          <Text style={styles.productTagText}>{cat.name}</Text>
                        </View>
                      )}
                      <View style={styles.productAddBtn}>
                        <Ionicons name="add" size={16} color={C.primary} />
                      </View>
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    {product.agotado ? (
                      <Text style={[styles.productPrice, { color: C.danger }]}>Agotado por hoy</Text>
                    ) : base && (
                      <Text style={styles.productPrice}>
                        ${base.price.toFixed(2)}
                        <Text style={styles.productUnit}> / {base.label}</Text>
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Barra fija del carrito ── */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Carrito')}
        >
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBarCount}>
              <Text style={styles.cartBarCountText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartBarLabel}>Ver carrito</Text>
          </View>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarTotal}>${cartTotal.toFixed(2)}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    // Coincide con el primer color del degradado del header (no con
    // C.primary a secas) — si no, en oscuro se nota una franja más clara
    // justo detrás de la barra de estado, antes de que arranque el header.
    backgroundColor: C.headerGradient[0],
  },

  // Header
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 34,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },

  // Búsqueda flotante — se superpone al límite entre el header y el sheet
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginHorizontal: 18,
    marginTop: -26,
    zIndex: 2,
    ...floatingShadow(C),
  },
  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },

  // Scroll
  scroll: {
    flex: 1,
    backgroundColor: C.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 48,
  },

  // Sección title
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },

  // Placeholder de "Destacados" mientras no hay productos reales cargados.
  comingSoonCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 28,
    ...cardShadow(C),
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginTop: 2,
  },
  comingSoonText: {
    fontSize: 13,
    color: C.textFaint,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Hero de horarios — degradado con blob + ícono fantasma grande de fondo,
  // en vez de la barra plana chica de antes.
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: 28,
    ...floatingShadow(C, C.primary),
  },
  heroBlob: {
    position: 'absolute',
    top: -50,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroIconGhost: {
    position: 'absolute',
    right: -18,
    bottom: -22,
    transform: [{ rotate: '-12deg' }],
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  heroSlots: {
    flexDirection: 'row',
    gap: 8,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  slotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Cuadrícula de categorías: tarjeta clara + ícono + nombre (sin foto ni
  // degradado — livianas y siempre visibles desde el primer render).
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  categoryTile: {
    width: '47%',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    paddingHorizontal: 10,
    ...cardShadow(C),
  },
  categoryTileIconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTileName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },

  // Grilla de destacados: 2 columnas
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  productCard: {
    width: '47%',
    gap: 6,
  },
  productImageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: C.surfaceAlt,
    ...cardShadow(C),
  },
  productTag: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productAddBtn: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow(C),
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.primary,
  },
  productUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textFaint,
  },

  // Barra fija del carrito
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: C.success,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
    ...floatingShadow(C, C.success),
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBarCount: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBarCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cartBarLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartBarTotal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

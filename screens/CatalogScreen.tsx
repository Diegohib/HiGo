import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/types';
import { PRODUCTS, Product } from '../data/products';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Catalog'>;
  route: RouteProp<HomeStackParamList, 'Catalog'>;
};

export default function CatalogScreen({ navigation, route }: Props) {
  const { categoryId } = route.params;
  const [search, setSearch] = useState('');

  const products = PRODUCTS.filter(p => {
    const matchesCategory = p.categoryId === categoryId;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && (search === '' || matchesSearch);
  });

  // Subcategorías únicas de esta categoría
  const subcats = ['Todos', ...Array.from(new Set(products.map(p => p.subcategory)))];
  const [activeSubcat, setActiveSubcat] = useState(0);

  const filtered = activeSubcat === 0
    ? products
    : products.filter(p => p.subcategory === subcats[activeSubcat]);

  function renderProduct({ item }: { item: Product }) {
    const basePrice = item.presentations[0];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Product', { productId: item.id })}
      >
        {/* Imagen placeholder */}
        <View style={[styles.imagePlaceholder, { backgroundColor: item.emojiColor }]}>
          <Text style={styles.imageEmoji}>{item.emoji}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardSubcat}>{item.subcategory}</Text>
          <Text style={styles.cardPrice}>
            ${basePrice.price.toFixed(2)}
            <Text style={styles.cardUnit}> / {basePrice.label}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Product', { productId: item.id })}
        >
          <Ionicons name="add" size={22} color="#3D1F8B" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Búsqueda ── */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#9B8EC4" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          placeholderTextColor="#9B8EC4"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9B8EC4" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Pills subcategorías ── */}
      {subcats.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {subcats.map((sub, i) => (
            <TouchableOpacity
              key={sub}
              style={[styles.pill, activeSubcat === i && styles.pillActive]}
              onPress={() => setActiveSubcat(i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, activeSubcat === i && styles.pillTextActive]}>
                {sub}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Lista de productos ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron productos</Text>
          </View>
        }
        renderItem={renderProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FF',
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
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
  },
  pillActive: {
    backgroundColor: '#3D1F8B',
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
    paddingBottom: 32,
    gap: 12,
  },

  // Tarjeta
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 36,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardSubcat: {
    fontSize: 12,
    color: '#9B8EC4',
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2ECC71',
    marginTop: 4,
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

  // Empty
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9B8EC4',
  },
});

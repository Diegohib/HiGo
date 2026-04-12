import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/types';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Catalog'>;
  route: RouteProp<HomeStackParamList, 'Catalog'>;
};

const SUBCATEGORIES = ['Todos', 'Frescos', 'Orgánicos', 'Importados', 'A granel'];

const PRODUCTS = [
  {
    id: '1',
    name: 'Tomate Riñón',
    category: 'Verduras',
    puesto: 'Puesto #12 — Mercado Central',
    price: 0.80,
    unit: 'kg',
    image: 'https://via.placeholder.com/80/388E3C/FFFFFF?text=🍅',
  },
  {
    id: '2',
    name: 'Papa Chola',
    category: 'Tubérculos',
    puesto: 'Puesto #5 — Mercado Norte',
    price: 0.50,
    unit: 'kg',
    image: 'https://via.placeholder.com/80/8B6914/FFFFFF?text=🥔',
  },
  {
    id: '3',
    name: 'Cebolla Paiteña',
    category: 'Verduras',
    puesto: 'Puesto #8 — Mercado Central',
    price: 0.60,
    unit: 'kg',
    image: 'https://via.placeholder.com/80/C4623A/FFFFFF?text=🧅',
  },
  {
    id: '4',
    name: 'Zanahoria',
    category: 'Hortalizas',
    puesto: 'Puesto #3 — Mercado Sur',
    price: 0.40,
    unit: 'kg',
    image: 'https://via.placeholder.com/80/C4943A/FFFFFF?text=🥕',
  },
];

export default function CatalogScreen({ route }: Props) {
  const { categoryName } = route.params;
  const [activeSubcat, setActiveSubcat] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function increment(id: string) {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function decrement(id: string) {
    setQuantities(prev => {
      const next = (prev[id] ?? 0) - 1;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  }

  return (
    <View style={styles.container}>

      {/* ── Búsqueda ── */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#9B8EC4" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tomates, papas, cebollas..."
          placeholderTextColor="#9B8EC4"
        />
      </View>

      {/* ── Pills de subcategorías ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {SUBCATEGORIES.map((sub, i) => (
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

      {/* ── Lista de productos ── */}
      <FlatList
        data={PRODUCTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const qty = quantities[item.id] ?? 0;
          return (
            <View style={styles.productCard}>
              <Image
                source={{ uri: item.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>{item.category}</Text>
                <Text style={styles.productPuesto} numberOfLines={1}>{item.puesto}</Text>
                <Text style={styles.productPrice}>
                  ${item.price.toFixed(2)}
                  <Text style={styles.productUnit}> / {item.unit}</Text>
                </Text>
              </View>
              <View style={styles.qtyControl}>
                {qty > 0 ? (
                  <>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(item.id)}>
                      <Ionicons name="remove" size={16} color="#3D1F8B" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                  </>
                ) : null}
                <TouchableOpacity style={styles.addBtn} onPress={() => increment(item.id)}>
                  <Ionicons name="add" size={20} color="#3D1F8B" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },

  // Pills
  pillsRow: {
    paddingHorizontal: 18,
    paddingBottom: 14,
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
  productList: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 12,
  },

  // Tarjeta de producto
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    shadowColor: '#3D1F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F0EEFF',
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  productMeta: {
    fontSize: 12,
    color: '#9B8EC4',
    fontWeight: '600',
  },
  productPuesto: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2ECC71',
    marginTop: 4,
  },
  productUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9B8EC4',
  },

  // Control de cantidad
  qtyControl: {
    alignItems: 'center',
    gap: 6,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D1F8B',
  },
});

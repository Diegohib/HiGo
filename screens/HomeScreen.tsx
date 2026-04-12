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
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { CATEGORIES } from '../data/products';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
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
          {CATEGORIES.map((cat) => (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#3D1F8B',
  },
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
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cartButton: {
    width: 36,
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
  },
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
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  categoryCard: {
    width: '47.5%',
    borderRadius: 18,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryEmoji: { fontSize: 42 },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  repeatButton: {
    backgroundColor: '#3D1F8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
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
});

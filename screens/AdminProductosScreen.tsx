import {
  useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useProductsStore } from '../store/productsStore';
import { Product, Category, Presentation } from '../data/products';
import { useFaqStore, Faq } from '../store/faqStore';
import { useThemeColors } from '../theme/useThemeColors';
import { cardShadow, floatingShadow } from '../theme/elevation';
import { ThemeColors } from '../theme/colors';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AdminProductos'>;
};

type Tab = 'productos' | 'categorias' | 'faqs';

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AdminProductosScreen({ navigation }: Props) {
  const C = useThemeColors();
  const styles = makeStyles(C);

  const products    = useProductsStore(s => s.products);
  const categories  = useProductsStore(s => s.categories);
  const loaded      = useProductsStore(s => s.loaded);
  const seedInitialCatalog = useProductsStore(s => s.seedInitialCatalog);
  const addProduct     = useProductsStore(s => s.addProduct);
  const updateProduct  = useProductsStore(s => s.updateProduct);
  const deleteProduct  = useProductsStore(s => s.deleteProduct);
  const addCategory    = useProductsStore(s => s.addCategory);
  const updateCategory = useProductsStore(s => s.updateCategory);
  const deleteCategory = useProductsStore(s => s.deleteCategory);

  const faqs        = useFaqStore(s => s.faqs);
  const faqsLoaded   = useFaqStore(s => s.loaded);
  const seedFaqs     = useFaqStore(s => s.seedFaqs);
  const deleteFaq    = useFaqStore(s => s.deleteFaq);

  const [tab, setTab] = useState<Tab>('productos');
  const [editingProduct,  setEditingProduct]  = useState<Product | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedingFaqs, setSeedingFaqs] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedInitialCatalog();
    } catch (error: any) {
      console.error('[AdminProductos] seed error:', error?.code, error?.message);
      Alert.alert('Error', 'No se pudo importar el catálogo inicial.');
    } finally {
      setSeeding(false);
    }
  }

  async function handleSeedFaqs() {
    setSeedingFaqs(true);
    try {
      await seedFaqs();
    } catch (error: any) {
      console.error('[AdminProductos] seed faqs error:', error?.code, error?.message);
      Alert.alert('Error', 'No se pudieron importar las preguntas frecuentes.');
    } finally {
      setSeedingFaqs(false);
    }
  }

  function handleDeleteFaq(f: Faq) {
    Alert.alert('Eliminar pregunta', `¿Eliminar "${f.question}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteFaq(f.id) },
    ]);
  }

  function handleDeleteProduct(p: Product) {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteProduct(p.id) },
    ]);
  }

  function handleDeleteCategory(c: Category) {
    const inUse = products.some(p => p.categoryId === c.id);
    if (inUse) {
      Alert.alert(
        'No se puede eliminar',
        'Hay productos usando esta categoría. Cambiales la categoría o eliminalos primero.'
      );
      return;
    }
    Alert.alert('Eliminar categoría', `¿Eliminar "${c.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteCategory(c.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo</Text>
        {tab === 'faqs' ? (
          <View style={styles.headerBtn} />
        ) : (
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => (tab === 'productos' ? setEditingProduct('new') : setEditingCategory('new'))}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'productos' && styles.tabBtnActive]}
          activeOpacity={0.8}
          onPress={() => setTab('productos')}
        >
          <Text style={[styles.tabText, tab === 'productos' && styles.tabTextActive]}>
            Productos ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'categorias' && styles.tabBtnActive]}
          activeOpacity={0.8}
          onPress={() => setTab('categorias')}
        >
          <Text style={[styles.tabText, tab === 'categorias' && styles.tabTextActive]}>
            Categorías ({categories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'faqs' && styles.tabBtnActive]}
          activeOpacity={0.8}
          onPress={() => setTab('faqs')}
        >
          <Text style={[styles.tabText, tab === 'faqs' && styles.tabTextActive]}>
            Preguntas ({faqs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Vacío: ofrecer importar catálogo inicial ── */}
      {loaded && products.length === 0 && categories.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cloud-upload-outline" size={44} color={C.textFaint} />
          <Text style={styles.emptyTitle}>Todavía no hay catálogo cargado</Text>
          <Text style={styles.emptyText}>
            Importá el catálogo inicial para empezar — después vas a poder editar, agregar y borrar productos desde acá.
          </Text>
          <TouchableOpacity
            style={[styles.seedBtn, seeding && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleSeed}
            disabled={seeding}
          >
            <Text style={styles.seedBtnText}>{seeding ? 'Importando…' : 'Importar catálogo inicial'}</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'faqs' ? (
        faqsLoaded && faqs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={44} color={C.textFaint} />
            <Text style={styles.emptyTitle}>Todavía no hay preguntas frecuentes</Text>
            <Text style={styles.emptyText}>
              Importá las preguntas iniciales para que el Asistente HiGo pueda responderlas — después vas a poder borrarlas desde acá.
            </Text>
            <TouchableOpacity
              style={[styles.seedBtn, seedingFaqs && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSeedFaqs}
              disabled={seedingFaqs}
            >
              <Text style={styles.seedBtnText}>{seedingFaqs ? 'Importando…' : 'Importar preguntas frecuentes'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={faqs}
            keyExtractor={f => f.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.resyncBtn, seedingFaqs && { opacity: 0.6 }]}
                activeOpacity={0.8}
                onPress={handleSeedFaqs}
                disabled={seedingFaqs}
              >
                <Ionicons name="refresh-outline" size={15} color={C.primary} />
                <Text style={styles.resyncBtnText}>
                  {seedingFaqs ? 'Actualizando…' : 'Actualizar con las preguntas por defecto'}
                </Text>
              </TouchableOpacity>
            }
            ListEmptyComponent={<Text style={styles.emptyListText}>Sin preguntas todavía.</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.rowIconBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.primary} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.question}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>{item.answer}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={() => handleDeleteFaq(item)}>
                  <Ionicons name="trash-outline" size={18} color={C.danger} />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : tab === 'productos' ? (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyListText}>Sin productos todavía.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => setEditingProduct(item)}>
              <Image source={{ uri: item.image }} style={styles.rowImage} resizeMode="cover" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {categories.find(c => c.id === item.categoryId)?.name ?? item.categoryId}
                  {item.presentations[0] ? ` · $${item.presentations[0].price.toFixed(2)} / ${item.presentations[0].label}` : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={() => handleDeleteProduct(item)}>
                <Ionicons name="trash-outline" size={18} color={C.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyListText}>Sin categorías todavía.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => setEditingCategory(item)}>
              <Image source={{ uri: item.image }} style={styles.rowImage} resizeMode="cover" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>
                  {products.filter(p => p.categoryId === item.id).length} producto{products.filter(p => p.categoryId === item.id).length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={() => handleDeleteCategory(item)}>
                <Ionicons name="trash-outline" size={18} color={C.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Formularios ── */}
      {editingProduct !== null && (
        <ProductFormModal
          initial={editingProduct === 'new' ? null : editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSave={async (data) => {
            if (editingProduct === 'new') await addProduct(data);
            else await updateProduct(editingProduct.id, data);
            setEditingProduct(null);
          }}
        />
      )}

      {editingCategory !== null && (
        <CategoryFormModal
          initial={editingCategory === 'new' ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={async (data) => {
            if (editingCategory === 'new') await addCategory(data);
            else await updateCategory(editingCategory.id, data);
            setEditingCategory(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Formulario de producto ───────────────────────────────────────────────────

function ProductFormModal({
  initial, categories, onClose, onSave,
}: {
  initial:    Product | null;
  categories: Category[];
  onClose:    () => void;
  onSave:     (data: Omit<Product, 'id'>) => Promise<void>;
}) {
  const C = useThemeColors();
  const styles = makeStyles(C);

  const [name,         setName]         = useState(initial?.name ?? '');
  const [categoryId,   setCategoryId]   = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [subcategory,  setSubcategory]  = useState(initial?.subcategory ?? '');
  const [image,        setImage]        = useState(initial?.image ?? '');
  const [description,  setDescription]  = useState(initial?.description ?? '');
  const [presentations, setPresentations] = useState<Presentation[]>(
    initial?.presentations ?? [{ label: 'Libra', price: 0, weightLbs: 1 }]
  );
  const [saving, setSaving] = useState(false);

  function updatePresentation(i: number, field: keyof Presentation, value: string) {
    setPresentations(prev => prev.map((p, idx) =>
      idx === i ? { ...p, [field]: field === 'label' ? value : Number(value) || 0 } : p
    ));
  }
  function addPresentation() {
    setPresentations(prev => [...prev, { label: '', price: 0, weightLbs: 0 }]);
  }
  function removePresentation(i: number) {
    setPresentations(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!name.trim() || !categoryId || !image.trim() || presentations.length === 0 || presentations.some(p => !p.label.trim())) {
      Alert.alert('Faltan datos', 'Completá nombre, categoría, foto y al menos una presentación con su unidad.');
      return;
    }
    setSaving(true);
    try {
      const cat = categories.find(c => c.id === categoryId);
      await onSave({
        name: name.trim(),
        categoryId,
        subcategory: subcategory.trim() || cat?.name || '',
        emoji: initial?.emoji ?? cat?.emoji ?? '🛒',
        emojiColor: initial?.emojiColor ?? cat?.color ?? '#3D1F8B',
        image: image.trim(),
        description: description.trim(),
        presentations,
      });
    } catch (error: any) {
      console.error('[AdminProductos] save product error:', error?.code, error?.message);
      Alert.alert('Error', 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{initial ? 'Editar producto' : 'Nuevo producto'}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={C.textFaint} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Papa Chola" placeholderTextColor={C.textFaint} />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chipRow}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Subcategoría</Text>
            <TextInput style={styles.input} value={subcategory} onChangeText={setSubcategory} placeholder="Ej: Arroz, Huevos..." placeholderTextColor={C.textFaint} />

            <Text style={styles.label}>Foto (URL)</Text>
            <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." placeholderTextColor={C.textFaint} autoCapitalize="none" />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción del producto"
              placeholderTextColor={C.textFaint}
              multiline
            />

            <Text style={styles.label}>Presentaciones</Text>
            <View style={styles.presHeaderRow}>
              <Text style={[styles.presHeaderText, styles.presInput]}>Unidad</Text>
              <Text style={[styles.presHeaderText, styles.presInputSmall]}>Precio $</Text>
              <Text style={[styles.presHeaderText, styles.presInputSmall]}>Libras</Text>
            </View>
            {presentations.map((p, i) => (
              <View key={i} style={styles.presentationRow}>
                <TextInput
                  style={[styles.input, styles.presInput]}
                  value={p.label}
                  onChangeText={t => updatePresentation(i, 'label', t)}
                  placeholder="Libra"
                  placeholderTextColor={C.textFaint}
                />
                <TextInput
                  style={[styles.input, styles.presInputSmall]}
                  value={String(p.price)}
                  onChangeText={t => updatePresentation(i, 'price', t)}
                  placeholder="0.50"
                  keyboardType="decimal-pad"
                  placeholderTextColor={C.textFaint}
                />
                <TextInput
                  style={[styles.input, styles.presInputSmall]}
                  value={String(p.weightLbs)}
                  onChangeText={t => updatePresentation(i, 'weightLbs', t)}
                  placeholder="1"
                  keyboardType="decimal-pad"
                  placeholderTextColor={C.textFaint}
                />
                {presentations.length > 1 && (
                  <TouchableOpacity style={styles.presRemoveBtn} activeOpacity={0.7} onPress={() => removePresentation(i)}>
                    <Ionicons name="close-circle" size={20} color={C.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addPresBtn} activeOpacity={0.7} onPress={addPresentation}>
              <Ionicons name="add-circle-outline" size={18} color={C.primary} />
              <Text style={styles.addPresBtnText}>Agregar presentación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Formulario de categoría ──────────────────────────────────────────────────

function CategoryFormModal({
  initial, onClose, onSave,
}: {
  initial: Category | null;
  onClose: () => void;
  onSave:  (data: Omit<Category, 'id'>) => Promise<void>;
}) {
  const C = useThemeColors();
  const styles = makeStyles(C);

  const [name,  setName]  = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🛒');
  const [color, setColor] = useState(initial?.color ?? '#3D1F8B');
  const [image, setImage] = useState(initial?.image ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !image.trim()) {
      Alert.alert('Faltan datos', 'Completá al menos el nombre y la foto.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), emoji: emoji.trim() || '🛒', color: color.trim() || '#3D1F8B', image: image.trim() });
    } catch (error: any) {
      console.error('[AdminProductos] save category error:', error?.code, error?.message);
      Alert.alert('Error', 'No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{initial ? 'Editar categoría' : 'Nueva categoría'}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={C.textFaint} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Frutas" placeholderTextColor={C.textFaint} />

            <Text style={styles.label}>Foto (URL)</Text>
            <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." placeholderTextColor={C.textFaint} autoCapitalize="none" />

            <Text style={styles.label}>Color de marca (hex)</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="#3D1F8B" placeholderTextColor={C.textFaint} autoCapitalize="none" />

            <Text style={styles.label}>Emoji de respaldo</Text>
            <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} placeholder="🛒" placeholderTextColor={C.textFaint} />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  tabRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    borderRadius: 10, backgroundColor: C.background,
    borderWidth: 1.5, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.primaryFaint, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textSoft },
  tabTextActive: { color: C.primary },

  emptyBox: { alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: C.textFaint, textAlign: 'center', lineHeight: 19 },
  seedBtn: { marginTop: 10, backgroundColor: C.primary, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 24, ...floatingShadow(C) },
  seedBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  list: { padding: 14, gap: 10 },
  emptyListText: { textAlign: 'center', color: C.textFaint, marginTop: 40 },
  resyncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginBottom: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
  },
  resyncBtnText: { fontSize: 12.5, fontWeight: '700', color: C.primary },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 10,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow(C),
  },
  rowImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.surfaceAlt },
  rowIconBox: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 14, fontWeight: '700', color: C.text },
  rowSub: { fontSize: 12, color: C.textFaint },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,30,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.text },

  label: { fontSize: 12, fontWeight: '700', color: C.textSoft, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: C.background, borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.background, borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textSoft },
  chipTextActive: { color: '#FFFFFF' },

  presHeaderRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  presHeaderText: { fontSize: 11, fontWeight: '700', color: C.textFaint },
  presentationRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  presInput: { flex: 2 },
  presInputSmall: { flex: 1 },
  presRemoveBtn: { padding: 2 },
  addPresBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 4 },
  addPresBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },

  saveBtn: { marginTop: 20, backgroundColor: C.primary, borderRadius: 18, paddingVertical: 15, alignItems: 'center', ...floatingShadow(C) },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

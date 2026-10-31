import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  PRODUCTS as SEED_PRODUCTS,
  CATEGORIES as SEED_CATEGORIES,
  Product,
  Category,
} from '../data/products';

// ─── Store ────────────────────────────────────────────────────────────────────
// El catálogo vive en Firestore (colecciones "products" y "categories"),
// lectura pública — incluye clientes que navegan sin haber iniciado sesión.
// Solo un admin puede escribir (según las reglas de seguridad).

interface ProductsState {
  products: Product[];
  categories: Category[];
  loaded: boolean;
  addProduct:      (data: Omit<Product, 'id'>) => Promise<string>;
  updateProduct:   (id: string, data: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct:   (id: string) => Promise<void>;
  addCategory:     (data: Omit<Category, 'id'>) => Promise<string>;
  updateCategory:  (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory:  (id: string) => Promise<void>;
  seedInitialCatalog: () => Promise<void>;
}

export const useProductsStore = create<ProductsState>()(() => ({
  products: [],
  categories: [],
  loaded: false,

  addProduct: async (data) => {
    const docRef = await addDoc(collection(db, 'products'), data);
    return docRef.id;
  },

  updateProduct: async (id, data) => {
    await updateDoc(doc(db, 'products', id), data);
  },

  deleteProduct: async (id) => {
    await deleteDoc(doc(db, 'products', id));
  },

  addCategory: async (data) => {
    const docRef = await addDoc(collection(db, 'categories'), data);
    return docRef.id;
  },

  updateCategory: async (id, data) => {
    await updateDoc(doc(db, 'categories', id), data);
  },

  deleteCategory: async (id) => {
    await deleteDoc(doc(db, 'categories', id));
  },

  // Carga única del catálogo de arranque (data/products.ts) a Firestore — se
  // usa una sola vez desde la pantalla de administración cuando la colección
  // todavía está vacía. Mantiene los mismos ids (tb1, fr1, tuberculos, ...)
  // para no romper carritos ya guardados en dispositivos.
  seedInitialCatalog: async () => {
    const batch = writeBatch(db);
    SEED_CATEGORIES.forEach(({ id, ...rest }) => {
      batch.set(doc(db, 'categories', id), rest);
    });
    SEED_PRODUCTS.forEach(({ id, ...rest }) => {
      batch.set(doc(db, 'products', id), rest);
    });
    await batch.commit();
  },
}));

// ─── Suscripción en vivo ────────────────────────────────────────────────────
// Pública — no depende de la sesión, así que se activa una sola vez al
// cargar el módulo (a diferencia de adminSolicitudesStore, que sí depende
// del rol de quien esté logueado).

onSnapshot(collection(db, 'categories'), (snap) => {
  const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  useProductsStore.setState({ categories });
});

onSnapshot(collection(db, 'products'), (snap) => {
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  useProductsStore.setState({ products, loaded: true });
});

// ─── Categorías para mostrar (Home, Catálogo) ──────────────────────────────
// Mientras nadie haya cargado categorías reales a Firestore (recién
// instalado, o antes de correr "seedInitialCatalog" desde el admin), se
// muestran los rubros de arranque como vitrina — así el catálogo siempre
// tiene su estructura visible aunque todavía no haya un solo producto
// cargado. A propósito NO se usa este helper en AdminProductosScreen: ahí se
// necesita la lista real (vacía si Firestore está vacío) para saber si hay
// que ofrecer el botón de importar, y para no editar/borrar categorías que
// en realidad no existen todavía como documentos.
export function useDisplayCategories(): Category[] {
  const categories = useProductsStore((s) => s.categories);
  return categories.length > 0 ? categories : SEED_CATEGORIES;
}

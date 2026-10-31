import { create } from 'zustand';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRODUCTS as SEED_PRODUCTS, CATEGORIES as SEED_CATEGORIES } from '../data/products';
import { Product, Category } from '../types';

interface ProductsState {
  products: Product[];
  categories: Category[];
  loaded: boolean;
  addProduct: (data: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<string>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
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

onSnapshot(collection(db, 'products'), (snap) => {
  useProductsStore.setState({
    products: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) })),
    loaded: true,
  });
});

onSnapshot(collection(db, 'categories'), (snap) => {
  useProductsStore.setState({
    categories: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })),
  });
});

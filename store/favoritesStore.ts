import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  productIds: string[];
  toggleFavorite: (productId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      productIds: [],

      toggleFavorite: (productId) =>
        set((s) => ({
          productIds: s.productIds.includes(productId)
            ? s.productIds.filter((id) => id !== productId)
            : [...s.productIds, productId],
        })),
    }),
    {
      name: 'higo-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

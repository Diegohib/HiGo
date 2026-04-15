import { create } from 'zustand';

export type CartItem = {
  productId: string;
  presentationIndex: number;
  presentationLabel: string;
  presentationPrice: number;
  quantity: number;
};

// Clave única para identificar una línea del carrito
function itemKey(productId: string, presentationIndex: number) {
  return `${productId}__${presentationIndex}`;
}

type CartStore = {
  items: CartItem[];
  totalItems: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (productId: string, presentationIndex: number, delta: number) => void;
  removeItem: (productId: string, presentationIndex: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  totalItems: 0,

  addItem: ({ productId, presentationIndex, presentationLabel, presentationPrice, quantity = 1 }) => {
    const key = itemKey(productId, presentationIndex);
    const existing = get().items.find(
      i => itemKey(i.productId, i.presentationIndex) === key,
    );
    let newItems: CartItem[];
    if (existing) {
      newItems = get().items.map(i =>
        itemKey(i.productId, i.presentationIndex) === key
          ? { ...i, quantity: i.quantity + quantity }
          : i,
      );
    } else {
      newItems = [
        ...get().items,
        { productId, presentationIndex, presentationLabel, presentationPrice, quantity },
      ];
    }
    set({ items: newItems, totalItems: newItems.reduce((s, i) => s + i.quantity, 0) });
  },

  updateQuantity: (productId, presentationIndex, delta) => {
    const key = itemKey(productId, presentationIndex);
    const newItems = get().items
      .map(i =>
        itemKey(i.productId, i.presentationIndex) === key
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i,
      )
      .filter(i => i.quantity > 0);
    set({ items: newItems, totalItems: newItems.reduce((s, i) => s + i.quantity, 0) });
  },

  removeItem: (productId, presentationIndex) => {
    const key = itemKey(productId, presentationIndex);
    const newItems = get().items.filter(
      i => itemKey(i.productId, i.presentationIndex) !== key,
    );
    set({ items: newItems, totalItems: newItems.reduce((s, i) => s + i.quantity, 0) });
  },

  clearCart: () => set({ items: [], totalItems: 0 }),
}));

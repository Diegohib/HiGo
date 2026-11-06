import { create } from 'zustand';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthStore } from './authStore';

// Chat acotado a un pedido puntual, entre el cliente que lo hizo y el cochero
// que lo reclamó (ver firestore.rules — orderChats/{orderId} valida contra el
// pedido real, no contra estos mensajes). Mismo patrón que store/chatStore.ts,
// pero soporta 'cochero' como remitente además de 'cliente'.

export interface OrderChatMessage {
  id: string;
  senderId: string;
  senderRole: 'cliente' | 'cochero';
  text: string;
  createdAt: number;
}

interface OrderChatState {
  messages: OrderChatMessage[];
  subscribe: (orderId: string) => () => void;
  sendMessage: (orderId: string, text: string) => Promise<void>;
}

function toMessage(id: string, data: any): OrderChatMessage {
  return {
    id,
    senderId: data.senderId,
    senderRole: data.senderRole,
    text: data.text,
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
  };
}

export const useOrderChatStore = create<OrderChatState>()((set) => ({
  messages: [],

  subscribe: (orderId) => {
    const q = query(collection(db, 'orderChats', orderId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snap) => set({ messages: snap.docs.map((d) => toMessage(d.id, d.data())) }),
      (error) => console.error('[orderChatStore] messages listener error:', error.code, error.message),
    );
  },

  sendMessage: async (orderId, text) => {
    if (!auth.currentUser) return;
    const senderRole = useAuthStore.getState().user?.role === 'cochero' ? 'cochero' : 'cliente';
    await addDoc(collection(db, 'orderChats', orderId, 'messages'), {
      senderId: auth.currentUser.uid,
      senderRole,
      text,
      createdAt: serverTimestamp(),
    });
  },
}));

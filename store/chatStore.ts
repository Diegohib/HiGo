import { create } from 'zustand';
import {
  collection, doc, addDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthStore } from './authStore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'cliente' | 'admin';
  text: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  subscribe: () => () => void;
  sendMessage: (text: string) => Promise<void>;
}

function toMessage(id: string, data: any): ChatMessage {
  return {
    id,
    senderId: data.senderId,
    senderRole: data.senderRole,
    text: data.text,
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
  };
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],

  subscribe: () => {
    if (!auth.currentUser) return () => {};
    const q = query(
      collection(db, 'supportChats', auth.currentUser.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      set({ messages: snap.docs.map((d) => toMessage(d.id, d.data())) });
    });
  },

  sendMessage: async (text) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    await addDoc(collection(db, 'supportChats', uid, 'messages'), {
      senderId: uid,
      senderRole: 'cliente',
      text,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'supportChats', uid), {
      uid,
      clientName: useAuthStore.getState().user?.name ?? 'Cliente',
      lastMessageAt: serverTimestamp(),
      lastMessageText: text,
      lastMessageSenderRole: 'cliente',
      unreadByAdmin: true,
    }, { merge: true });
  },
}));

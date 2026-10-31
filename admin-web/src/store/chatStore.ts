import { create } from 'zustand';
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { ChatMessage, ChatThread } from '../types';

interface ChatState {
  threads: ChatThread[];
  activeUid: string | null;
  activeMessages: ChatMessage[];
  openThread: (uid: string) => void;
  closeThread: () => void;
  sendMessage: (uid: string, text: string) => Promise<void>;
}

let unsubThreads: (() => void) | null = null;
let unsubMessages: (() => void) | null = null;

export const useChatStore = create<ChatState>()((_set, get) => ({
  threads: [],
  activeUid: null,
  activeMessages: [],

  openThread: (uid) => {
    unsubMessages?.();
    useChatStore.setState({ activeUid: uid, activeMessages: [] });

    unsubMessages = onSnapshot(
      query(collection(db, 'supportChats', uid, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => {
        useChatStore.setState({
          activeMessages: snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              senderId: data.senderId,
              senderRole: data.senderRole,
              text: data.text,
              createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
            } as ChatMessage;
          }),
        });
      }
    );

    const thread = get().threads.find((t) => t.uid === uid);
    if (thread?.unreadByAdmin) {
      updateDoc(doc(db, 'supportChats', uid), { unreadByAdmin: false });
    }
  },

  closeThread: () => {
    unsubMessages?.();
    unsubMessages = null;
    useChatStore.setState({ activeUid: null, activeMessages: [] });
  },

  sendMessage: async (uid, text) => {
    await addDoc(collection(db, 'supportChats', uid, 'messages'), {
      senderId: useAuthStore.getState().user?.uid ?? 'admin',
      senderRole: 'admin',
      text,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, 'supportChats', uid),
      {
        lastMessageAt: serverTimestamp(),
        lastMessageText: text,
        lastMessageSenderRole: 'admin',
        unreadByAdmin: false,
      },
      { merge: true }
    );
  },
}));

// Se llama de entrada con el estado actual (además de en cada cambio futuro):
// como las páginas cargan con React.lazy, este módulo recién se importa al
// navegar a Chats, y para entonces la sesión admin ya pudo haberse resuelto
// antes — subscribe() de zustand no dispara con el estado ya vigente.
function syncAuth(state: { user: unknown }) {
  const isAdmin = !!state.user;

  if (isAdmin && !unsubThreads) {
    unsubThreads = onSnapshot(query(collection(db, 'supportChats'), orderBy('lastMessageAt', 'desc')), (snap) => {
      const threads = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          clientName: data.clientName ?? 'Cliente',
          lastMessageAt: (data.lastMessageAt as Timestamp | undefined)?.toMillis() ?? 0,
          lastMessageText: data.lastMessageText ?? '',
          lastMessageSenderRole: data.lastMessageSenderRole ?? 'cliente',
          unreadByAdmin: !!data.unreadByAdmin,
        } as ChatThread;
      });
      useChatStore.setState({ threads });
    });
  } else if (!isAdmin && unsubThreads) {
    unsubThreads();
    unsubThreads = null;
    unsubMessages?.();
    unsubMessages = null;
    useChatStore.setState({ threads: [], activeUid: null, activeMessages: [] });
  }
}

useAuthStore.subscribe(syncAuth);
syncAuth(useAuthStore.getState());

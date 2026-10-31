import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { Order } from '../types';

const PAGE_SIZE = 100;

interface OrdersState {
  orders: Order[];
  loaded: boolean;
  hasMore: boolean;
  clientNames: Record<string, string>;
  loadMore: () => void;
  confirmarPago: (orderId: string) => Promise<void>;
  rechazarPago: (orderId: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>()(() => ({
  orders: [],
  loaded: false,
  hasMore: false,
  clientNames: {},

  loadMore: () => {
    pageSize += PAGE_SIZE;
    subscribe();
  },

  // Confirmar una transferencia libera el pedido: el pedido y sus tickets por
  // puesto pasan a released, y recién ahí lo ven comerciantes y cocheros.
  confirmarPago: async (orderId) => {
    const tickets = await getDocs(query(collection(db, 'stallTickets'), where('orderId', '==', orderId)));
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', orderId), { paymentStatus: 'verificado', released: true });
    tickets.forEach((t) => batch.update(t.ref, { released: true }));
    await batch.commit();
  },

  rechazarPago: async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { paymentStatus: 'rechazado' });
  },
}));

// Resuelve nombres de cliente una sola vez por uid (getDoc puntual, no
// listener) — evita abrir un onSnapshot por cada pedido solo para mostrar un
// nombre que casi nunca cambia.
async function resolveClientNames(uids: string[]) {
  const cache = useOrdersStore.getState().clientNames;
  const missing = [...new Set(uids)].filter((uid) => !(uid in cache));
  if (missing.length === 0) return;

  const entries = await Promise.all(
    missing.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        return [uid, (snap.data()?.name as string | undefined) ?? 'Cliente'] as const;
      } catch {
        return [uid, 'Cliente'] as const;
      }
    })
  );

  useOrdersStore.setState((s) => ({ clientNames: { ...s.clientNames, ...Object.fromEntries(entries) } }));
}

let unsub: (() => void) | null = null;
let pageSize = PAGE_SIZE;

function subscribe() {
  unsub?.();
  unsub = onSnapshot(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(pageSize)),
    (snap) => {
      const orders = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
        } as Order;
      });
      useOrdersStore.setState({ orders, loaded: true, hasMore: orders.length === pageSize });
      resolveClientNames(orders.map((o) => o.uid));
    }
  );
}

// Se llama de entrada con el estado actual (además de en cada cambio futuro):
// como las páginas cargan con React.lazy, este módulo recién se importa al
// navegar a Pedidos, y para entonces la sesión admin ya pudo haberse resuelto
// antes — subscribe() de zustand no dispara con el estado ya vigente.
function syncAuth(state: { user: unknown }) {
  const isAdmin = !!state.user;

  if (isAdmin && !unsub) {
    pageSize = PAGE_SIZE;
    subscribe();
  } else if (!isAdmin && unsub) {
    unsub();
    unsub = null;
    useOrdersStore.setState({ orders: [], loaded: false, hasMore: false, clientNames: {} });
  }
}

useAuthStore.subscribe(syncAuth);
syncAuth(useAuthStore.getState());

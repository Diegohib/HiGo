import { create } from 'zustand';
import { collection, doc, deleteField, limit, onSnapshot, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { RejectionReason, Solicitud } from '../types';

const PAGE_SIZE = 100;

interface SolicitudesState {
  solicitudes: Solicitud[];
  loaded: boolean;
  hasMore: boolean;
  aprobar: (id: string) => Promise<void>;
  rechazar: (id: string, reason: RejectionReason) => Promise<void>;
  loadMore: () => void;
}

export const useSolicitudesStore = create<SolicitudesState>()((_set, get) => ({
  solicitudes: [],
  loaded: false,
  hasMore: false,

  aprobar: async (id) => {
    const sol = get().solicitudes.find((s) => s.id === id);
    if (!sol) return;
    await updateDoc(doc(db, 'solicitudes', id), { status: 'aprobada', rejectionReason: deleteField() });
    await updateDoc(doc(db, 'users', sol.uid), { status: 'approved', rejectionReason: deleteField() });
  },

  rechazar: async (id, reason) => {
    const sol = get().solicitudes.find((s) => s.id === id);
    if (!sol) return;
    await updateDoc(doc(db, 'solicitudes', id), { status: 'rechazada', rejectionReason: reason });
    await updateDoc(doc(db, 'users', sol.uid), { status: 'rejected', rejectionReason: reason });
  },

  loadMore: () => {
    pageSize += PAGE_SIZE;
    subscribe();
  },
}));

// ─── Suscripción en vivo (solo mientras haya sesión admin) ─────────────────────

let unsub: (() => void) | null = null;
let pageSize = PAGE_SIZE;

function subscribe() {
  unsub?.();
  unsub = onSnapshot(
    query(collection(db, 'solicitudes'), orderBy('requestedAt', 'desc'), limit(pageSize)),
    (snap) => {
      const solicitudes = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          requestedAt: (data.requestedAt as Timestamp | undefined)?.toDate() ?? new Date(),
        } as Solicitud;
      });
      useSolicitudesStore.setState({ solicitudes, loaded: true, hasMore: solicitudes.length === pageSize });
    },
    (error) => {
      console.error('[solicitudesStore] listener error:', error.code, error.message);
      useSolicitudesStore.setState({ loaded: true });
    }
  );
}

// Se llama de entrada con el estado actual (además de en cada cambio futuro):
// como las páginas cargan con React.lazy, este módulo recién se importa
// cuando se navega a Solicitudes, y para entonces la sesión admin ya pudo
// haberse resuelto antes — subscribe() de zustand no dispara con el estado
// ya vigente, solo con cambios posteriores.
function syncAuth(state: { user: unknown }) {
  const isAdmin = !!state.user;

  if (isAdmin && !unsub) {
    pageSize = PAGE_SIZE;
    subscribe();
  } else if (!isAdmin && unsub) {
    unsub();
    unsub = null;
    useSolicitudesStore.setState({ solicitudes: [], loaded: false, hasMore: false });
  }
}

useAuthStore.subscribe(syncAuth);
syncAuth(useAuthStore.getState());

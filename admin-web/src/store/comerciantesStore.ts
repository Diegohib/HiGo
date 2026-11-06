import { create } from 'zustand';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';

// Comerciantes aprobados del Mercado Mayorista — son los puestos a los que se
// asigna cada producto del catálogo.

export interface Comerciante {
  uid: string;
  name: string;
  stallNumber: string;
  giro: string;
}

interface ComerciantesState {
  comerciantes: Comerciante[];
  loaded: boolean;
}

export const useComerciantesStore = create<ComerciantesState>()(() => ({
  comerciantes: [],
  loaded: false,
}));

// ─── Suscripción en vivo (solo mientras haya sesión admin) ─────────────────────

let unsub: (() => void) | null = null;

// Se llama de entrada con el estado actual, igual que en solicitudesStore:
// este módulo puede importarse cuando la sesión ya se resolvió.
function syncAuth(state: { user: unknown }) {
  const isAdmin = !!state.user;

  if (isAdmin && !unsub) {
    unsub = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'comerciante'), where('status', '==', 'approved')),
      (snap) => {
        const comerciantes = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              name: data.name ?? 'Comerciante',
              stallNumber: data.stallNumber ?? '',
              giro: data.giro ?? '',
            };
          })
          .sort((a, b) => a.stallNumber.localeCompare(b.stallNumber, 'es', { numeric: true }));
        useComerciantesStore.setState({ comerciantes, loaded: true });
      },
      (error) => {
        console.error('[comerciantesStore] listener error:', error.code, error.message);
        useComerciantesStore.setState({ loaded: true });
      }
    );
  } else if (!isAdmin && unsub) {
    unsub();
    unsub = null;
    useComerciantesStore.setState({ comerciantes: [], loaded: false });
  }
}

useAuthStore.subscribe(syncAuth);
syncAuth(useAuthStore.getState());

import { create } from 'zustand';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { claimOrderWithTickets } from './stallTicketsStore';
import { CartItem } from './cartStore';
import { OrderStatus } from './ordersStore';

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Ya no hay tickets inventados: cada "ticket" es un pedido real de la colección
// "orders" con operatorRole == 'cochero'. Mientras operatorUid esté vacío el
// pedido vive en el pool "disponibles" (cualquier cochero aprobado lo puede
// reclamar); en cuanto se reclama pasa a "mios" y deja de aparecer para los
// demás — lo garantizan las reglas de Firestore, no un filtro local.

export interface Ticket {
  id: string;
  address: string;
  timeSlot: string;
  deliveryType: 'programada' | 'directa';
  status: OrderStatus;
  orderTotal: number;
  // Valor de los productos (base del pago del cochero). Pedidos viejos sin
  // desglose usan el total.
  productSubtotal: number;
  items: CartItem[];
  createdAt: number;
}

interface CocheroTicketState {
  disponibles: Ticket[];
  mios: Ticket[];
  loaded: boolean;
  reclamar: (ticketId: string) => Promise<void>;
  marcarConsolidado: (ticketId: string) => Promise<void>;
}

function toTicket(id: string, data: any): Ticket {
  return {
    id,
    address: data.address,
    timeSlot: data.estimatedTime,
    deliveryType: data.deliveryType ?? 'programada',
    status: data.status,
    orderTotal: data.total,
    productSubtotal: data.subtotal ?? data.total,
    items: data.items ?? [],
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
  };
}

export const useCocheroTicketStore = create<CocheroTicketState>()((_set, get) => ({
  disponibles: [],
  mios: [],
  loaded: false,

  reclamar: async (ticketId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    await claimOrderWithTickets(
      ticketId,
      { operatorUid: user.uid, operatorName: user.name, operatorPhone: user.phone, status: 'en_mercado' },
      { uid: user.uid, name: user.name, role: 'cochero' },
    );
  },

  // Solo para pedidos viejos, de antes de los tickets por puesto: los nuevos
  // pasan a 'consolidado' solos cuando se retira el último puesto.
  marcarConsolidado: async (ticketId) => {
    const ticket = get().mios.find((t) => t.id === ticketId);
    if (!ticket) return;
    await updateDoc(doc(db, 'orders', ticketId), { status: 'consolidado' });
  },
}));

// ─── Suscripciones en vivo (solo mientras la sesión sea de un cochero) ─────────

let unsubDisponibles: (() => void) | null = null;
let unsubMios: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const isCochero = state.user?.role === 'cochero' && state.user.status === 'approved';

  if (isCochero && !unsubDisponibles) {
    unsubDisponibles = onSnapshot(
      query(
        collection(db, 'orders'),
        where('operatorRole', '==', 'cochero'),
        where('status', '==', 'recibido'),
        where('operatorUid', '==', ''),
        orderBy('createdAt', 'asc')
      ),
      (snap) => {
        // "Lo antes posible" primero; el resto, por orden de llegada. Las
        // transferencias sin confirmar todavía no se muestran (released false).
        const disponibles = snap.docs
          .filter((d) => d.data().released !== false)
          .map((d) => toTicket(d.id, d.data()))
          .sort((a, b) =>
            (a.deliveryType === 'directa' ? 0 : 1) - (b.deliveryType === 'directa' ? 0 : 1) ||
            a.createdAt - b.createdAt);
        useCocheroTicketStore.setState({ disponibles, loaded: true });
      }
    );

    unsubMios = onSnapshot(
      query(
        collection(db, 'orders'),
        where('operatorUid', '==', state.user!.uid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        useCocheroTicketStore.setState({ mios: snap.docs.map((d) => toTicket(d.id, d.data())) });
      }
    );
  } else if (!isCochero && unsubDisponibles) {
    unsubDisponibles();
    unsubMios?.();
    unsubDisponibles = null;
    unsubMios = null;
    useCocheroTicketStore.setState({ disponibles: [], mios: [], loaded: false });
  }
});

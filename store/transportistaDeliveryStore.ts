import { create } from 'zustand';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { CartItem } from './cartStore';
import { OrderStatus } from './ordersStore';
import { WAREHOUSE_LAT, WAREHOUSE_LNG, haversineKm } from '../utils/transport';
import { calcTransportistaEarning } from '../utils/earnings';

export { WAREHOUSE_LAT, WAREHOUSE_LNG };

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Ya no hay entregas inventadas: cada "entrega" es un pedido real de la
// colección "orders" listo para transportar —
//   ruta programada: status == 'consolidado' (el cochero ya juntó todo)
//   ruta directa:    status == 'recibido'    (sin paso por el mercado)
// — y con transportistaUid vacío. En cuanto un transportista lo toma pasa a
// "mías" y deja de aparecer para los demás (lo garantizan las reglas de
// Firestore, no un filtro local).

export interface Delivery {
  id:         string;
  address:    string;
  timeSlot:   string;
  status:     OrderStatus;
  route:      'directa' | 'programada';
  orderTotal: number;
  itemCount:  number;
  distanceKm: number;
  earning:    number;
  lat?:       number;
  lng?:       number;
  // Efectivo contra entrega: lo que hay que cobrarle al cliente (0 si ya pagó).
  cashToCollect: number;
  createdAt:  number;
}

interface TransportistaDeliveryState {
  disponibles:      Delivery[];
  mias:             Delivery[];
  loaded:           boolean;
  disponible:       boolean;
  toggleDisponible: () => void;
  iniciarEntrega:   (id: string) => Promise<void>;
  confirmarEntrega: (id: string) => Promise<void>;
}

function toDelivery(id: string, data: any): Delivery {
  const lat = typeof data.deliveryLat === 'number' ? data.deliveryLat : undefined;
  const lng = typeof data.deliveryLng === 'number' ? data.deliveryLng : undefined;
  const distanceKm = lat != null && lng != null
    ? haversineKm(WAREHOUSE_LAT, WAREHOUSE_LNG, lat, lng)
    : 0;
  const items: CartItem[] = data.items ?? [];
  return {
    id,
    address:    data.address,
    timeSlot:   data.estimatedTime,
    status:     data.status,
    // Pedidos viejos sin deliveryType: los de operatorRole 'transportista'
    // eran entregas directas.
    route:      data.deliveryType ?? (data.operatorRole === 'transportista' ? 'directa' : 'programada'),
    orderTotal: data.total,
    itemCount:  items.reduce((s, it) => s + it.quantity, 0),
    distanceKm,
    // El envío completo que pagó el cliente; pedidos viejos sin ese dato, con
    // la fórmula anterior.
    earning:    typeof data.shippingCost === 'number' ? data.shippingCost : calcTransportistaEarning(distanceKm),
    lat,
    lng,
    cashToCollect: data.paymentMethod === 'efectivo' ? data.total : 0,
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
  };
}

export const useTransportistaDeliveryStore = create<TransportistaDeliveryState>()((_set, get) => ({
  disponibles: [],
  mias: [],
  loaded: false,
  disponible: true,

  toggleDisponible: () => useTransportistaDeliveryStore.setState((s) => ({ disponible: !s.disponible })),

  iniciarEntrega: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    await updateDoc(doc(db, 'orders', id), {
      transportistaUid:   user.uid,
      transportistaName:  user.name,
      transportistaPhone: user.phone ?? '',
      status: 'en_camino',
    });
  },

  confirmarEntrega: async (id) => {
    const mine = get().mias.find((d) => d.id === id);
    if (!mine) return;
    // Efectivo: al entregar, el transportista ya cobró.
    await updateDoc(doc(db, 'orders', id), mine.cashToCollect > 0
      ? { status: 'entregado', paymentStatus: 'cobrado' }
      : { status: 'entregado' });
  },
}));

// ─── Suscripciones en vivo (solo mientras la sesión sea de un transportista) ───
// Dos queries para "disponibles" porque son dos condiciones distintas
// (consolidado de ruta programada + recibido de ruta directa) que Firestore no
// puede pedir en una sola query; se juntan acá.

let unsubProgramada: (() => void) | null = null;
let unsubDirecta:    (() => void) | null = null;
let unsubMias:       (() => void) | null = null;

let progList: Delivery[] = [];
let dirList:  Delivery[] = [];

// Las directas ("lo antes posible") primero; dentro de cada grupo, por orden
// de llegada.
function pushDisponibles() {
  const merged = [...progList, ...dirList].sort((a, b) =>
    (a.route === 'directa' ? 0 : 1) - (b.route === 'directa' ? 0 : 1) || a.createdAt - b.createdAt);
  useTransportistaDeliveryStore.setState({ disponibles: merged, loaded: true });
}

useAuthStore.subscribe((state) => {
  const isTransportista = state.user?.role === 'transportista' && state.user.status === 'approved';

  if (isTransportista && !unsubProgramada) {
    unsubProgramada = onSnapshot(
      query(
        collection(db, 'orders'),
        where('operatorRole', '==', 'cochero'),
        where('status', '==', 'consolidado'),
        where('transportistaUid', '==', ''),
        orderBy('createdAt', 'asc')
      ),
      (snap) => { progList = snap.docs.map((d) => toDelivery(d.id, d.data())); pushDisponibles(); }
    );

    unsubDirecta = onSnapshot(
      query(
        collection(db, 'orders'),
        where('operatorRole', '==', 'transportista'),
        where('status', '==', 'recibido'),
        where('transportistaUid', '==', ''),
        orderBy('createdAt', 'asc')
      ),
      (snap) => { dirList = snap.docs.map((d) => toDelivery(d.id, d.data())); pushDisponibles(); }
    );

    unsubMias = onSnapshot(
      query(
        collection(db, 'orders'),
        where('transportistaUid', '==', state.user!.uid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        useTransportistaDeliveryStore.setState({ mias: snap.docs.map((d) => toDelivery(d.id, d.data())) });
      }
    );
  } else if (!isTransportista && unsubProgramada) {
    unsubProgramada(); unsubDirecta?.(); unsubMias?.();
    unsubProgramada = unsubDirecta = unsubMias = null;
    progList = [];
    dirList = [];
    useTransportistaDeliveryStore.setState({ disponibles: [], mias: [], loaded: false });
  }
});

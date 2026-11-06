import { create } from 'zustand';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { CartItem } from './cartStore';
import { useProductsStore } from './productsStore';
import { addStallTicketsToBatch } from './stallTicketsStore';
import { VehicleType } from '../utils/transport';

export type OrderStatus =
  | 'recibido'
  | 'en_mercado'
  | 'consolidado'
  | 'en_camino'
  | 'entregado'
  // Fuera de la secuencia: el cliente lo cancela antes de que un cochero lo
  // tome, o el admin en cualquier momento desde el panel web.
  | 'cancelado';

// ─── Pago ─────────────────────────────────────────────────────────────────────
//   transferencia → el cliente sube el comprobante ('por_verificar'); el admin
//                   lo confirma ('verificado') o lo rechaza ('rechazado').
//   efectivo      → se cobra al entregar ('contra_entrega' → 'cobrado' cuando
//                   el transportista confirma la entrega). Tope: CASH_LIMIT.
//   'reembolsado' → transferencia confirmada de un pedido cancelado, ya
//                   devuelta por el admin.
// `released`: si el pedido ya puede moverse (comerciantes y cochero lo ven).
// Transferencia: recién cuando el admin confirma el pago. Efectivo: enseguida.
// Pedidos viejos no traen nada de esto y se tratan como liberados.

export type PaymentMethod = 'transferencia' | 'efectivo';
export type PaymentStatus = 'por_verificar' | 'verificado' | 'rechazado' | 'contra_entrega' | 'cobrado' | 'reembolsado';

export const CASH_LIMIT = 100;

export interface Order {
  id: string;
  uid: string;
  address: string;
  estimatedTime: string;
  status: OrderStatus;
  // `operatorRole` marca la ruta del pedido:
  //   'cochero'      → entrega programada: un cochero recoge en el mercado y
  //                    consolida; después un transportista lo lleva.
  //   'transportista'→ solo pedidos viejos: entrega directa sin cochero. Hoy
  //                    todo pedido pasa por un cochero.
  operatorRole: 'cochero' | 'transportista';
  // Lo que eligió el cliente. 'directa' = lo antes posible: mismo recorrido
  // (cochero → transportista) pero con prioridad. Pedidos viejos no lo traen.
  deliveryType?: 'programada' | 'directa';
  // Cochero asignado (solo ruta 'cochero'). Vacío hasta que un cochero lo reclama.
  operatorName: string;
  operatorPhone: string;
  operatorUid: string;
  // Transportista asignado (ambas rutas). Vacío hasta que un transportista lo toma.
  transportistaName: string;
  transportistaPhone: string;
  transportistaUid: string;
  deliveryLat?: number;
  deliveryLng?: number;
  // Desglose del total (pedidos viejos no lo traen):
  //   subtotal      → productos, se le paga a cada comerciante
  //   managementFee → 7 % de gestión: de acá sale el pago del cochero, el resto es de HiGo
  //   shippingCost  → envío según vehículo y distancia: completo para el transportista
  subtotal?: number;
  managementFee?: number;
  shippingCost?: number;
  vehicle?: VehicleType;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  receiptUrl?: string;
  paymentRef?: string;   // número de comprobante de la transferencia
  released?: boolean;
  // Cuándo se juntó todo en el mercado y cuándo se entregó (pedidos viejos no
  // los traen); con eso se calculan las ganancias de cada día.
  consolidadoAt?: number;
  deliveredAt?: number;
  cancelledAt?: number;
  cancelledBy?: 'cliente' | 'admin';
  total: number;
  items: CartItem[];
  createdAt: number;
}

// El cliente puede cancelar mientras ningún cochero lo haya tomado.
export function canClientCancel(order: Order): boolean {
  return order.status === 'recibido' && !order.operatorUid;
}

interface OrdersState {
  orders: Order[];
  createOrder: (data: Omit<Order, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  cancelOrder: (id: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>()(() => ({
  orders: [],

  // El pedido y sus tickets por puesto (ver stallTicketsStore) se guardan en
  // un solo batch: o se crea todo, o nada.
  createOrder: async (data) => {
    const orderRef = doc(collection(db, 'orders'));
    const batch = writeBatch(db);
    batch.set(orderRef, {
      ...data,
      status: 'recibido',
      createdAt: serverTimestamp(),
    });
    addStallTicketsToBatch(batch, {
      orderId:       orderRef.id,
      clientUid:     data.uid,
      route:         data.deliveryType ?? 'programada',
      estimatedTime: data.estimatedTime,
      items:         data.items,
      products:      useProductsStore.getState().products,
      released:      data.released ?? true,
    });
    await batch.commit();
    return orderRef.id;
  },

  // Pedido y tickets en un solo batch, así ningún puesto se queda preparando
  // un pedido cancelado.
  cancelOrder: async (id) => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) return;
    const tickets = await getDocs(query(
      collection(db, 'stallTickets'),
      where('orderId', '==', id),
      where('clientUid', '==', uid),
    ));
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', id), { status: 'cancelado', cancelledAt: serverTimestamp(), cancelledBy: 'cliente' });
    tickets.forEach((t) => batch.update(t.ref, { status: 'cancelado' }));
    await batch.commit();
  },
}));

// ─── Suscripción en vivo ────────────────────────────────────────────────────
// El cliente ve solo sus pedidos; el admin ve todos. Se reactiva cada vez que
// cambia el usuario autenticado (login/logout/cambio de rol).

let unsubOrders: (() => void) | null = null;

function toOrder(id: string, data: any): Order {
  return {
    ...data,
    id,
    // Pedidos viejos (de antes de este campo) no traen estos valores — se
    // normalizan a '' para que las queries por igualdad funcionen igual.
    operatorUid:        data.operatorUid ?? '',
    transportistaUid:   data.transportistaUid ?? '',
    transportistaName:  data.transportistaName ?? '',
    transportistaPhone: data.transportistaPhone ?? '',
    consolidadoAt: (data.consolidadoAt as Timestamp | undefined)?.toMillis(),
    deliveredAt:   (data.deliveredAt as Timestamp | undefined)?.toMillis(),
    cancelledAt:   (data.cancelledAt as Timestamp | undefined)?.toMillis(),
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
  } as Order;
}

useAuthStore.subscribe((state) => {
  unsubOrders?.();
  unsubOrders = null;

  if (!state.user || state.user.status !== 'approved') {
    useOrdersStore.setState({ orders: [] });
    return;
  }

  const ordersQuery = state.user.role === 'admin'
    ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    : query(collection(db, 'orders'), where('uid', '==', state.user.uid), orderBy('createdAt', 'desc'));

  unsubOrders = onSnapshot(
    ordersQuery,
    (snap) => useOrdersStore.setState({ orders: snap.docs.map((d) => toOrder(d.id, d.data())) }),
    (error) => console.error('[ordersStore] orders listener error:', error.code, error.message),
  );
});

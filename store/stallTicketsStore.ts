import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartItem } from './cartStore';
import { Product } from '../data/products';

// ─── Tickets por puesto ───────────────────────────────────────────────────────
// Un pedido junta productos de varios puestos del Mercado Mayorista. Al
// confirmarlo se parte en un ticket por puesto (colección "stallTickets"):
//
//   pendiente → el comerciante lo está preparando
//   listo     → el comerciante lo dejó listo para retirar
//   retirado  → el cochero (trabaja en el mercado) ya se lo llevó
//   cancelado → se canceló el pedido: no hay que prepararlo
//
// Cuando todos los tickets de un pedido quedan retirados, el pedido pasa solo
// a 'consolidado' y queda disponible para los transportistas. Programada o
// directa recorren el mismo camino; la directa solo tiene prioridad.
//
// Los productos sin puesto asignado van a un ticket "Sin puesto" que ningún
// comerciante ve: el cochero los consigue y lo marca retirado.

export type StallTicketStatus = 'pendiente' | 'listo' | 'retirado' | 'cancelado';
export type OrderRoute = 'programada' | 'directa';

export const NO_STALL_UID = '';

export interface StallTicketItem {
  productId:         string;
  productName:       string;
  emoji:             string;
  presentationLabel: string;
  quantity:          number;
  subtotal:          number;
}

export interface StallTicket {
  id:              string;
  orderId:         string;
  clientUid:       string;
  comercianteUid:  string;
  comercianteName: string;
  stallNumber:     string;
  route:           OrderRoute;
  estimatedTime:   string;
  items:           StallTicketItem[];
  subtotal:        number;
  status:          StallTicketStatus;
  pickerUid:       string;
  pickerName:      string;
  pickerRole:      '' | 'cochero' | 'transportista';
  // Igual que el pedido: false mientras se verifica una transferencia (el
  // comerciante todavía no tiene que prepararlo). Tickets viejos no lo traen.
  released?:       boolean;
  createdAt:       number;
  retiradoAt:      number | null;
}

export function toStallTicket(id: string, data: any): StallTicket {
  return {
    ...data,
    id,
    createdAt:  (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
    retiradoAt: (data.retiradoAt as Timestamp | undefined)?.toMillis() ?? null,
  } as StallTicket;
}

// ─── Armado al confirmar el pedido ────────────────────────────────────────────
// Agrega al batch del pedido un ticket por puesto. Va en el mismo batch para
// que las reglas de Firestore puedan comprobar (con getAfter) que el pedido es
// de quien crea los tickets.

export function addStallTicketsToBatch(
  batch: WriteBatch,
  params: {
    orderId:       string;
    clientUid:     string;
    route:         OrderRoute;
    estimatedTime: string;
    items:         CartItem[];
    products:      Product[];
    released:      boolean;
  },
) {
  const groups = new Map<string, { name: string; stall: string; items: StallTicketItem[] }>();

  for (const item of params.items) {
    const product = params.products.find((p) => p.id === item.productId);
    const uid = product?.comercianteUid ?? NO_STALL_UID;
    if (!groups.has(uid)) {
      groups.set(uid, {
        name:  uid ? product?.comercianteName ?? 'Comerciante' : 'Sin puesto asignado',
        stall: uid ? product?.stallNumber ?? '' : '',
        items: [],
      });
    }
    groups.get(uid)!.items.push({
      productId:         item.productId,
      productName:       product?.name ?? 'Producto',
      emoji:             product?.emoji ?? '🛒',
      presentationLabel: item.presentationLabel,
      quantity:          item.quantity,
      subtotal:          item.presentationPrice * item.quantity,
    });
  }

  for (const [uid, g] of groups) {
    batch.set(doc(db, 'stallTickets', `${params.orderId}_${uid || 'sin-puesto'}`), {
      orderId:         params.orderId,
      clientUid:       params.clientUid,
      comercianteUid:  uid,
      comercianteName: g.name,
      stallNumber:     g.stall,
      route:           params.route,
      estimatedTime:   params.estimatedTime,
      items:           g.items,
      subtotal:        g.items.reduce((s, it) => s + it.subtotal, 0),
      status:          'pendiente',
      pickerUid:       '',
      pickerName:      '',
      pickerRole:      '',
      released:        params.released,
      createdAt:       serverTimestamp(),
      retiradoAt:      null,
    });
  }
}

// ─── Tomar un pedido ──────────────────────────────────────────────────────────
// El cochero que toma el pedido queda anotado en cada ticket, para que el
// comerciante sepa quién le va a retirar.

export async function claimOrderWithTickets(
  orderId: string,
  orderUpdate: Record<string, unknown>,
  picker: { uid: string; name: string; role: 'cochero' | 'transportista' },
) {
  const tickets = await getDocs(query(collection(db, 'stallTickets'), where('orderId', '==', orderId)));
  const batch = writeBatch(db);
  batch.update(doc(db, 'orders', orderId), orderUpdate);
  tickets.forEach((t) => {
    batch.update(t.ref, { pickerUid: picker.uid, pickerName: picker.name, pickerRole: picker.role });
  });
  await batch.commit();
}

// ─── Acciones ─────────────────────────────────────────────────────────────────

export async function marcarListo(ticketId: string) {
  await updateDoc(doc(db, 'stallTickets', ticketId), { status: 'listo', listoAt: serverTimestamp() });
}

export async function marcarRetirado(ticket: StallTicket) {
  await updateDoc(doc(db, 'stallTickets', ticket.id), { status: 'retirado', retiradoAt: serverTimestamp() });

  const all = await getDocs(query(collection(db, 'stallTickets'), where('orderId', '==', ticket.orderId)));
  const allRetirados = all.docs.every((d) => d.id === ticket.id || d.data().status === 'retirado');
  if (allRetirados) {
    await updateDoc(doc(db, 'orders', ticket.orderId), { status: 'consolidado', consolidadoAt: serverTimestamp() });
  }
}

// ─── Tickets de un pedido, en vivo ────────────────────────────────────────────
// `clientUid` lo pasa el cliente (las reglas solo le dejan leer los suyos);
// cochero/transportista/admin lo omiten.

export function useOrderStallTickets(orderId: string, clientUid?: string) {
  const [tickets, setTickets] = useState<StallTicket[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const constraints = [where('orderId', '==', orderId)];
    if (clientUid) constraints.push(where('clientUid', '==', clientUid));
    const unsub = onSnapshot(
      query(collection(db, 'stallTickets'), ...constraints),
      (snap) => {
        const list = snap.docs.map((d) => toStallTicket(d.id, d.data()));
        // Los de puesto real primero, ordenados por número; "Sin puesto" al final.
        list.sort((a, b) =>
          (a.comercianteUid ? 0 : 1) - (b.comercianteUid ? 0 : 1) ||
          a.stallNumber.localeCompare(b.stallNumber, 'es', { numeric: true }));
        setTickets(list);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return unsub;
  }, [orderId, clientUid]);

  return { tickets, loaded };
}

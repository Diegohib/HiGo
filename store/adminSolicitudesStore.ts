import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SolicitudStatus = 'pendiente' | 'aprobada' | 'rechazada';
export type SolicitudRole   = 'cochero' | 'transportista' | 'comerciante';

export interface Solicitud {
  id:               string;
  uid:              string;
  name:             string;
  phone:            string;
  email?:           string;
  role:             SolicitudRole;
  requestedAt:      Date;
  avatar:           string;
  documents:        string[];
  photoUris?:       Record<string, string>;
  extraData:        Record<string, string>;
  status:           SolicitudStatus;
  rejectionReason?: string;
}

export const REJECTION_REASONS = [
  'Foto ilegible',
  'Cédula no coincide',
  'Matrícula vencida',
  'Información incompleta',
  'Cédula duplicada',
  'Cupo lleno por zona',
] as const;

export type RejectionReason = typeof REJECTION_REASONS[number];

// ─── Store ────────────────────────────────────────────────────────────────────
// Las solicitudes ahora viven en Firestore. Solo un admin tiene permiso (según
// las reglas de seguridad) para leer la colección completa, así que el listener
// en vivo se activa/desactiva según el rol del usuario autenticado.

interface AdminSolicitudesState {
  solicitudes:       Solicitud[];
  agregarSolicitud:  (data: Omit<Solicitud, 'id' | 'requestedAt' | 'status'>) => Promise<string>;
  aprobar:           (id: string) => Promise<void>;
  rechazar:          (id: string, reason: RejectionReason) => Promise<void>;
}

export const useAdminSolicitudesStore = create<AdminSolicitudesState>()((set, get) => ({
  solicitudes: [],

  agregarSolicitud: async (data) => {
    const docRef = await addDoc(collection(db, 'solicitudes'), {
      ...data,
      requestedAt: serverTimestamp(),
      status: 'pendiente',
    });
    return docRef.id;
  },

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
}));

// ─── Suscripción en vivo (solo admin) ──────────────────────────────────────────

let unsubSolicitudes: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const isAdmin = state.user?.role === 'admin' && state.user.status === 'approved';

  if (isAdmin && !unsubSolicitudes) {
    unsubSolicitudes = onSnapshot(
      query(collection(db, 'solicitudes'), orderBy('requestedAt', 'desc')),
      (snap) => {
        const solicitudes = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            requestedAt: (data.requestedAt as Timestamp | undefined)?.toDate() ?? new Date(),
          } as Solicitud;
        });
        useAdminSolicitudesStore.setState({ solicitudes });
      }
    );
  } else if (!isAdmin && unsubSolicitudes) {
    unsubSolicitudes();
    unsubSolicitudes = null;
    useAdminSolicitudesStore.setState({ solicitudes: [] });
  }
});

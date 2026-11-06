import { create } from 'zustand';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

// ─── Store ────────────────────────────────────────────────────────────────────
// En la app solo se crean solicitudes (registro del personal); revisarlas,
// aprobarlas o rechazarlas se hace en el panel web.

interface AdminSolicitudesState {
  agregarSolicitud: (data: Omit<Solicitud, 'id' | 'requestedAt' | 'status'>) => Promise<string>;
}

export const useAdminSolicitudesStore = create<AdminSolicitudesState>()(() => ({
  agregarSolicitud: async (data) => {
    const docRef = await addDoc(collection(db, 'solicitudes'), {
      ...data,
      requestedAt: serverTimestamp(),
      status: 'pendiente',
    });
    return docRef.id;
  },
}));

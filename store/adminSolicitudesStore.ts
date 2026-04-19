import { create } from 'zustand';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SolicitudStatus = 'pendiente' | 'aprobada' | 'rechazada';
export type SolicitudRole   = 'cochero' | 'transportista' | 'comerciante';

export interface Solicitud {
  id:              string;
  name:            string;
  phone:           string;
  role:            SolicitudRole;
  requestedAt:     Date;
  avatar:          string;   // emoji representativo
  documents:       string[]; // nombres de documentos adjuntos
  status:          SolicitudStatus;
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

// ─── Mock solicitudes ─────────────────────────────────────────────────────────

const MOCK_SOLICITUDES: Solicitud[] = [
  {
    id: 's1',
    name: 'Miguel Ángel Salazar',
    phone: '+593 98 211 3344',
    role: 'cochero',
    requestedAt: new Date('2026-04-17T09:15:00'),
    avatar: '🚲',
    documents: ['Foto de cédula', 'Foto de perfil'],
    status: 'pendiente',
  },
  {
    id: 's2',
    name: 'Fernanda Castro',
    phone: '+593 99 455 6677',
    role: 'transportista',
    requestedAt: new Date('2026-04-17T11:30:00'),
    avatar: '🚚',
    documents: ['Foto de cédula', 'Foto de matrícula', 'Foto de perfil'],
    status: 'pendiente',
  },
  {
    id: 's3',
    name: 'Ramiro Quispe',
    phone: '+593 96 788 9900',
    role: 'comerciante',
    requestedAt: new Date('2026-04-17T14:05:00'),
    avatar: '🏪',
    documents: ['Foto de cédula', 'Foto de perfil'],
    status: 'pendiente',
  },
  {
    id: 's4',
    name: 'Lucía Benítez',
    phone: '+593 98 333 2211',
    role: 'cochero',
    requestedAt: new Date('2026-04-18T08:20:00'),
    avatar: '🚲',
    documents: ['Foto de cédula', 'Foto de perfil'],
    status: 'pendiente',
  },
  {
    id: 's5',
    name: 'Andrés Pillajo',
    phone: '+593 99 612 0033',
    role: 'transportista',
    requestedAt: new Date('2026-04-18T10:45:00'),
    avatar: '🚚',
    documents: ['Foto de cédula', 'Foto de matrícula', 'Foto de perfil'],
    status: 'pendiente',
  },
  {
    id: 's6',
    name: 'Marisol Vega',
    phone: '+593 97 500 4422',
    role: 'comerciante',
    requestedAt: new Date('2026-04-18T13:10:00'),
    avatar: '🏪',
    documents: ['Foto de cédula', 'Foto de perfil'],
    status: 'pendiente',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface AdminSolicitudesState {
  solicitudes:  Solicitud[];
  aprobar:      (id: string) => void;
  rechazar:     (id: string, reason: RejectionReason) => void;
}

export const useAdminSolicitudesStore = create<AdminSolicitudesState>((set) => ({
  solicitudes: MOCK_SOLICITUDES,

  aprobar: (id) =>
    set((s) => ({
      solicitudes: s.solicitudes.map((sol) =>
        sol.id === id ? { ...sol, status: 'aprobada', rejectionReason: undefined } : sol
      ),
    })),

  rechazar: (id, reason) =>
    set((s) => ({
      solicitudes: s.solicitudes.map((sol) =>
        sol.id === id ? { ...sol, status: 'rechazada', rejectionReason: reason } : sol
      ),
    })),
}));

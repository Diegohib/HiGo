import { create } from 'zustand';
import { nextPayFriday } from '../utils/earnings';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DispatchItem {
  productName: string;
  qty:         number;
  unit:        string;
}

export interface DispatchTicket {
  id:           string;
  orderId:      string;
  cocheroName:  string;
  cocheroEmoji: string;
  items:        DispatchItem[];
  scheduledAt:  Date;
  status:       'pendiente' | 'retirado';
  subtotal:     number;
}

export interface DaySale {
  date:      Date;
  dayLabel:  string;
  shortDate: string;
  orders:    number;
  amount:    number;
}

// ─── Mock tickets del día ─────────────────────────────────────────────────────

const MOCK_TICKETS: DispatchTicket[] = [
  {
    id: 'dt1', orderId: 'PED-0841',
    cocheroName: 'Carlos Toapanta', cocheroEmoji: '🚲',
    items: [
      { productName: 'Tomate riñón',    qty: 5, unit: 'kg'     },
      { productName: 'Papas cholas',    qty: 8, unit: 'kg'     },
      { productName: 'Cebolla paiteña', qty: 2, unit: 'kg'     },
    ],
    scheduledAt: new Date('2026-04-19T08:30:00'),
    status: 'retirado',
    subtotal: 18.50,
  },
  {
    id: 'dt2', orderId: 'PED-0842',
    cocheroName: 'Rosa Chicaiza', cocheroEmoji: '🚲',
    items: [
      { productName: 'Manzanas',  qty: 4, unit: 'kg'     },
      { productName: 'Naranjas',  qty: 6, unit: 'kg'     },
      { productName: 'Plátanos',  qty: 1, unit: 'racimo' },
    ],
    scheduledAt: new Date('2026-04-19T09:00:00'),
    status: 'pendiente',
    subtotal: 14.75,
  },
  {
    id: 'dt3', orderId: 'PED-0845',
    cocheroName: 'Luis Guamán', cocheroEmoji: '🚲',
    items: [
      { productName: 'Aguacates', qty: 6, unit: 'unid'   },
      { productName: 'Limones',   qty: 2, unit: 'kg'     },
      { productName: 'Pimientos', qty: 1, unit: 'kg'     },
      { productName: 'Cilantro',  qty: 3, unit: 'atados' },
    ],
    scheduledAt: new Date('2026-04-19T09:45:00'),
    status: 'pendiente',
    subtotal: 22.30,
  },
  {
    id: 'dt4', orderId: 'PED-0848',
    cocheroName: 'Carlos Toapanta', cocheroEmoji: '🚲',
    items: [
      { productName: 'Lechuga',    qty: 4, unit: 'unid' },
      { productName: 'Brócoli',    qty: 3, unit: 'unid' },
      { productName: 'Zanahorias', qty: 3, unit: 'kg'   },
    ],
    scheduledAt: new Date('2026-04-19T10:30:00'),
    status: 'pendiente',
    subtotal: 17.90,
  },
];

// ─── Mock ventas semana 14-19 abr ─────────────────────────────────────────────

const MOCK_WEEK_SALES: DaySale[] = [
  { date: new Date('2026-04-14'), dayLabel: 'Lunes',     shortDate: '14 abr', orders: 8,  amount: 312.50 },
  { date: new Date('2026-04-15'), dayLabel: 'Martes',    shortDate: '15 abr', orders: 11, amount: 487.25 },
  { date: new Date('2026-04-16'), dayLabel: 'Miércoles', shortDate: '16 abr', orders: 14, amount: 562.80 },
  { date: new Date('2026-04-17'), dayLabel: 'Jueves',    shortDate: '17 abr', orders: 12, amount: 498.60 },
  { date: new Date('2026-04-18'), dayLabel: 'Viernes',   shortDate: '18 abr', orders: 18, amount: 715.40 },
  { date: new Date('2026-04-19'), dayLabel: 'Sábado',    shortDate: '19 abr', orders: 4,  amount: 148.30 },
];

const WEEKLY_TOTAL = MOCK_WEEK_SALES.reduce((s, d) => s + d.amount, 0);

// ─── Store ────────────────────────────────────────────────────────────────────

interface ComercianteState {
  merchantName:    string;
  merchantStall:   string;
  dispatchTickets: DispatchTicket[];
  weeklySales:     DaySale[];
  fridayBalance:   number;
  fridayDate:      Date;
  markRetirado:    (id: string) => void;
}

export const useComercianteStore = create<ComercianteState>((set) => ({
  merchantName:    'Patricio Almeida',
  merchantStall:   'Puesto #12 · Frutas y verduras',
  dispatchTickets: MOCK_TICKETS,
  weeklySales:     MOCK_WEEK_SALES,
  fridayBalance:   parseFloat(WEEKLY_TOTAL.toFixed(2)),
  fridayDate:      nextPayFriday(),

  markRetirado: (id) =>
    set((s) => ({
      dispatchTickets: s.dispatchTickets.map((t) =>
        t.id === id ? { ...t, status: 'retirado' } : t
      ),
    })),
}));

import { create } from 'zustand';
import { calcEarning } from '../utils/earnings';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TicketStatus = 'pendiente' | 'en_mercado' | 'consolidado';

export interface TicketProduct {
  name:  string;
  qty:   string;   // "2 unidades", "5 kg", etc.
  stall: string;   // "Puesto 14-A"
  emoji: string;
}

export interface Ticket {
  id:          string;
  clientName:  string;
  orderTotal:  number;
  earning:     number;
  products:    TicketProduct[];
  status:      TicketStatus;
  timeSlot:    string;
}

// ─── Mock tickets del día ─────────────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: '001234',
    clientName: 'Ana Torres',
    orderTotal: 45.00,
    earning: calcEarning(45.00),
    timeSlot: '10:00 - 12:00',
    status: 'pendiente',
    products: [
      { name: 'Tomates', qty: '2 kg',       stall: 'Puesto 14-A', emoji: '🍅' },
      { name: 'Papa',    qty: '5 kg',       stall: 'Puesto 8-B',  emoji: '🥔' },
      { name: 'Cebolla', qty: '3 unidades', stall: 'Puesto 22-C', emoji: '🧅' },
    ],
  },
  {
    id: '001235',
    clientName: 'Marco Ruiz',
    orderTotal: 28.50,
    earning: calcEarning(28.50),
    timeSlot: '10:00 - 12:00',
    status: 'pendiente',
    products: [
      { name: 'Naranja',  qty: '10 kg', stall: 'Puesto 5-A',  emoji: '🍊' },
      { name: 'Limones',  qty: '2 kg',  stall: 'Puesto 5-A',  emoji: '🍋' },
    ],
  },
  {
    id: '001236',
    clientName: 'Sofía Mendez',
    orderTotal: 92.00,
    earning: calcEarning(92.00),
    timeSlot: '14:00 - 16:00',
    status: 'pendiente',
    products: [
      { name: 'Arroz',   qty: '10 kg', stall: 'Puesto 31-D', emoji: '🍚' },
      { name: 'Huevos',  qty: '30 unidades', stall: 'Puesto 19-B', emoji: '🥚' },
      { name: 'Azúcar',  qty: '5 kg',  stall: 'Puesto 12-A', emoji: '🍬' },
      { name: 'Fréjol',  qty: '2 kg',  stall: 'Puesto 28-C', emoji: '🫘' },
    ],
  },
  {
    id: '001237',
    clientName: 'Diego Vargas',
    orderTotal: 18.00,
    earning: calcEarning(18.00),
    timeSlot: '14:00 - 16:00',
    status: 'pendiente',
    products: [
      { name: 'Zanahoria', qty: '3 kg', stall: 'Puesto 7-C',  emoji: '🥕' },
      { name: 'Brócoli',   qty: '2 kg', stall: 'Puesto 11-A', emoji: '🥦' },
    ],
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface CocheroTicketState {
  tickets:        Ticket[];
  disponible:     boolean;
  toggleDisponible: () => void;
  iniciarRecogida:  (ticketId: string) => void;
  consolidarTodos:  () => void;
}

export const useCocheroTicketStore = create<CocheroTicketState>((set) => ({
  tickets:    MOCK_TICKETS,
  disponible: true,

  toggleDisponible: () =>
    set((s) => ({ disponible: !s.disponible })),

  iniciarRecogida: (ticketId) =>
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === ticketId ? { ...t, status: 'en_mercado' } : t
      ),
    })),

  consolidarTodos: () =>
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.status === 'en_mercado' ? { ...t, status: 'consolidado' } : t
      ),
    })),
}));

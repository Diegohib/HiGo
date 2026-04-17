import { create } from 'zustand';
import { formatShortDate, nextPayFriday } from '../utils/earnings';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type OperatorRole = 'cochero' | 'transportista';

export interface Operator {
  id:           string;
  name:         string;
  role:         OperatorRole;
  weekEarnings: number;   // saldo acumulado semana actual (0 tras pago)
  paidAmount:   number;   // monto del último pago realizado en esta sesión
  ordersCount:  number;   // pedidos / entregas de la semana
  kmThisWeek:   number;   // km recorridos (solo transportistas, 0 para cocheros)
  isPaid:       boolean;
}

export interface PaymentRecord {
  id:           string;
  operatorId:   string;
  operatorName: string;
  role:         OperatorRole;
  amount:       number;
  paidAt:       Date;
  weekLabel:    string;
}

// ─── Datos mock ───────────────────────────────────────────────────────────────

const INITIAL_OPERATORS: Operator[] = [
  // Cocheros
  { id: 'c1', name: 'Carlos Toapanta', role: 'cochero',       weekEarnings: 54.50, paidAmount: 0, ordersCount: 14, kmThisWeek: 0,    isPaid: false },
  { id: 'c2', name: 'Rosa Chicaiza',   role: 'cochero',       weekEarnings: 41.00, paidAmount: 0, ordersCount: 11, kmThisWeek: 0,    isPaid: false },
  { id: 'c3', name: 'Luis Guamán',     role: 'cochero',       weekEarnings: 38.75, paidAmount: 0, ordersCount: 10, kmThisWeek: 0,    isPaid: false },
  // Transportistas
  { id: 't1', name: 'Diego Morales',   role: 'transportista', weekEarnings: 86.23, paidAmount: 0, ordersCount: 22, kmThisWeek: 148.3, isPaid: false },
  { id: 't2', name: 'Ana Tipán',       role: 'transportista', weekEarnings: 72.50, paidAmount: 0, ordersCount: 18, kmThisWeek: 121.5, isPaid: false },
  { id: 't3', name: 'Jorge Paucar',    role: 'transportista', weekEarnings: 58.30, paidAmount: 0, ordersCount: 15, kmThisWeek: 98.7,  isPaid: false },
];

// Pagos de semanas anteriores (historial pre-cargado)
const INITIAL_HISTORY: PaymentRecord[] = [
  // Semana 6-10 abr — pagado el viernes 10 abr
  { id: 'h1',  operatorId: 'c1', operatorName: 'Carlos Toapanta', role: 'cochero',       amount: 48.75, paidAt: new Date('2026-04-10'), weekLabel: '6 – 10 abr' },
  { id: 'h2',  operatorId: 'c2', operatorName: 'Rosa Chicaiza',   role: 'cochero',       amount: 37.50, paidAt: new Date('2026-04-10'), weekLabel: '6 – 10 abr' },
  { id: 'h3',  operatorId: 'c3', operatorName: 'Luis Guamán',     role: 'cochero',       amount: 42.00, paidAt: new Date('2026-04-10'), weekLabel: '6 – 10 abr' },
  { id: 'h4',  operatorId: 't1', operatorName: 'Diego Morales',   role: 'transportista', amount: 92.40, paidAt: new Date('2026-04-10'), weekLabel: '6 – 10 abr' },
  { id: 'h5',  operatorId: 't2', operatorName: 'Ana Tipán',       role: 'transportista', amount: 68.90, paidAt: new Date('2026-04-10'), weekLabel: '6 – 10 abr' },
  { id: 'h6',  operatorId: 't3', operatorName: 'Jorge Paucar',    role: 'transportista', amount: 55.20, paidAt: new Date('2026-04-10'), weekLabel: '6 – 10 abr' },
  // Semana 30 mar-3 abr — pagado el viernes 3 abr
  { id: 'h7',  operatorId: 'c1', operatorName: 'Carlos Toapanta', role: 'cochero',       amount: 52.00, paidAt: new Date('2026-04-03'), weekLabel: '30 mar – 3 abr' },
  { id: 'h8',  operatorId: 'c2', operatorName: 'Rosa Chicaiza',   role: 'cochero',       amount: 44.25, paidAt: new Date('2026-04-03'), weekLabel: '30 mar – 3 abr' },
  { id: 'h9',  operatorId: 'c3', operatorName: 'Luis Guamán',     role: 'cochero',       amount: 36.00, paidAt: new Date('2026-04-03'), weekLabel: '30 mar – 3 abr' },
  { id: 'h10', operatorId: 't1', operatorName: 'Diego Morales',   role: 'transportista', amount: 88.75, paidAt: new Date('2026-04-03'), weekLabel: '30 mar – 3 abr' },
  { id: 'h11', operatorId: 't2', operatorName: 'Ana Tipán',       role: 'transportista', amount: 74.30, paidAt: new Date('2026-04-03'), weekLabel: '30 mar – 3 abr' },
  { id: 'h12', operatorId: 't3', operatorName: 'Jorge Paucar',    role: 'transportista', amount: 61.50, paidAt: new Date('2026-04-03'), weekLabel: '30 mar – 3 abr' },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface AdminPayState {
  operators:      Operator[];
  paymentHistory: PaymentRecord[];
  markAsPaid:     (operatorId: string) => void;
}

let historyCounter = INITIAL_HISTORY.length + 1;

export const useAdminPayStore = create<AdminPayState>((set, get) => ({
  operators:      INITIAL_OPERATORS,
  paymentHistory: INITIAL_HISTORY,

  markAsPaid: (operatorId: string) => {
    const operator = get().operators.find(o => o.id === operatorId);
    if (!operator || operator.isPaid || operator.weekEarnings === 0) return;

    const friday    = nextPayFriday();
    const weekLabel = buildCurrentWeekLabel();

    const record: PaymentRecord = {
      id:           `h${historyCounter++}`,
      operatorId:   operator.id,
      operatorName: operator.name,
      role:         operator.role,
      amount:       operator.weekEarnings,
      paidAt:       friday,
      weekLabel,
    };

    set(state => ({
      operators: state.operators.map(o =>
        o.id === operatorId
          ? { ...o, isPaid: true, paidAmount: o.weekEarnings, weekEarnings: 0 }
          : o,
      ),
      // El pago más reciente va al inicio del historial
      paymentHistory: [record, ...state.paymentHistory],
    }));
  },
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildCurrentWeekLabel(): string {
  const today = new Date();
  const dow   = today.getDay();
  const fromMonday = dow === 0 ? -6 : 1 - dow;
  const mon   = new Date(today); mon.setDate(today.getDate() + fromMonday);
  const fri   = new Date(mon);   fri.setDate(mon.getDate() + 4);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  if (mon.getMonth() === fri.getMonth()) {
    return `${mon.getDate()} – ${fri.getDate()} ${months[mon.getMonth()]}`;
  }
  return `${mon.getDate()} ${months[mon.getMonth()]} – ${fri.getDate()} ${months[fri.getMonth()]}`;
}

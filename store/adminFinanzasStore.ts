import { create } from 'zustand';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WeekFinance {
  id:               string;
  weekLabel:        string;
  fridayDate:       Date;
  totalIncome:      number;
  toComerciantes:   number;
  toCocheros:       number;
  toTransportistas: number;
  higoGross:        number;   // 7 % de gestión
  operationalCosts: number;   // costos operativos fijos
  higoNet:          number;   // higoGross - operationalCosts
  ordersCount:      number;
  status:           'pagado' | 'pendiente';
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function w(
  id: string, weekLabel: string, fridayDate: Date,
  totalIncome: number, toCocheros: number, toTransportistas: number,
  operationalCosts: number, ordersCount: number,
  status: 'pagado' | 'pendiente',
): WeekFinance {
  const higoGross      = parseFloat((totalIncome * 0.07).toFixed(2));
  const toComerciantes = parseFloat((totalIncome - higoGross - toCocheros - toTransportistas).toFixed(2));
  const higoNet        = parseFloat((higoGross - operationalCosts).toFixed(2));
  return {
    id, weekLabel, fridayDate, totalIncome,
    toComerciantes, toCocheros, toTransportistas,
    higoGross, operationalCosts, higoNet,
    ordersCount, status,
  };
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_WEEKS: WeekFinance[] = [
  w('w1', '14 – 18 abr 2026', new Date('2026-04-18'), 10_250.00, 351.00, 452.50, 180.00, 187, 'pendiente'),
  w('w2', '6 – 10 abr 2026',  new Date('2026-04-10'),  9_880.00, 338.75, 430.20, 175.00, 181, 'pagado'),
  w('w3', '30 mar – 3 abr',   new Date('2026-04-03'), 11_340.00, 392.50, 498.75, 192.00, 208, 'pagado'),
  w('w4', '23 – 27 mar 2026', new Date('2026-03-27'),  9_120.00, 312.25, 401.00, 168.00, 167, 'pagado'),
  w('w5', '16 – 20 mar 2026', new Date('2026-03-20'), 10_680.00, 367.50, 470.25, 184.00, 195, 'pagado'),
  w('w6', '9 – 13 mar 2026',  new Date('2026-03-13'),  8_940.00, 305.00, 388.50, 162.00, 163, 'pagado'),
  w('w7', '2 – 6 mar 2026',   new Date('2026-03-06'),  9_560.00, 328.75, 421.00, 171.00, 175, 'pagado'),
  w('w8', '23 – 27 feb 2026', new Date('2026-02-27'),  8_320.00, 285.50, 362.25, 155.00, 152, 'pagado'),
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface AdminFinanzasState {
  weeks: WeekFinance[];
}

export const useAdminFinanzasStore = create<AdminFinanzasState>(() => ({
  weeks: MOCK_WEEKS,
}));

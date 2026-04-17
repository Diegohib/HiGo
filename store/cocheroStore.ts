import { create } from 'zustand';
import { calcEarning, currentWeekDays, isToday, isPast } from '../utils/earnings';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DayRecord {
  date:        Date;
  ordersCount: number;
  orderTotals: number[];   // total de cada pedido (para calcular ganancia por tramo)
  earnings:    number;     // suma de ganancias del día
}

// ─── Datos mock: pedidos por posición en la semana (0=Lun … 4=Vie) ───────────
// Representa una semana real de trabajo. Los días futuros tienen count = 0.

const MOCK_BY_DOW: { count: number; totals: number[] }[] = [
  { count: 4, totals: [28.50, 55.00, 18.00, 92.00] }, // Lun
  { count: 3, totals: [42.00, 35.50, 120.00] },         // Mar
  { count: 5, totals: [65.00, 22.00, 80.00, 15.00, 50.00] }, // Mié
  { count: 2, totals: [38.00, 78.50] },                 // Jue
  { count: 0, totals: [] },                             // Vie (aún no transcurrido)
];

function buildWeekRecords(): DayRecord[] {
  const days = currentWeekDays();
  return days.map((date, idx) => {
    // Sólo mostrar datos en días pasados o en el día de hoy
    const hasData = isPast(date) || isToday(date);
    const mock    = hasData ? MOCK_BY_DOW[idx] : { count: 0, totals: [] };
    const earnings = mock.totals.reduce((sum, t) => sum + calcEarning(t), 0);
    return {
      date,
      ordersCount: mock.count,
      orderTotals: mock.totals,
      earnings,
    };
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CocheroState {
  weekRecords:       DayRecord[];
  weeklyEarnings:    number;
  todayEarnings:     number;
  todayOrdersCount:  number;
  totalOrdersCount:  number;
  refreshWeek:       () => void;
}

export const useCocheroStore = create<CocheroState>((set) => {
  function compute() {
    const records       = buildWeekRecords();
    const today         = records.find(r => isToday(r.date));
    const weeklyEarnings   = records.reduce((s, r) => s + r.earnings, 0);
    const todayEarnings    = today?.earnings     ?? 0;
    const todayOrdersCount = today?.ordersCount  ?? 0;
    const totalOrdersCount = records.reduce((s, r) => s + r.ordersCount, 0);
    return { weekRecords: records, weeklyEarnings, todayEarnings, todayOrdersCount, totalOrdersCount };
  }

  return {
    ...compute(),
    refreshWeek: () => set(compute()),
  };
});

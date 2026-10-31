import { useMemo } from 'react';
import { useOrdersStore } from './ordersStore';
import { buildWeeks, WeekFinance } from '../utils/finance';

export type { WeekFinance };

// Finanzas reales: se calculan de los pedidos que ve el admin (ordersStore ya
// le trae todos). Semana actual primero, después las 7 anteriores.
export function useAdminFinanzasStore(): { weeks: WeekFinance[] } {
  const orders = useOrdersStore((s) => s.orders);
  const weeks = useMemo(() => buildWeeks(orders), [orders]);
  return { weeks };
}

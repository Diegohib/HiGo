import { useMemo } from 'react';
import { calcEarning, currentWeekDays, isToday } from '../utils/earnings';
import { useCocheroTicketStore } from './cocheroTicketStore';
import { OrderStatus } from './ordersStore';

// ─── Ganancias del cochero ────────────────────────────────────────────────────
// Salen de sus pedidos reales (los "mios" de cocheroTicketStore): cuenta cada
// pedido que ya terminó de juntar — consolidado, en camino o entregado — de la
// semana actual, el día en que lo consolidó (pedidos viejos: el día del pedido).

export interface DayRecord {
  date:        Date;
  ordersCount: number;
  earnings:    number;
}

const DONE: OrderStatus[] = ['consolidado', 'en_camino', 'entregado'];

export function useCocheroStore() {
  const mios = useCocheroTicketStore((s) => s.mios);

  return useMemo(() => {
    const weekRecords: DayRecord[] = currentWeekDays().map((date) => ({ date, ordersCount: 0, earnings: 0 }));
    const weekStart = weekRecords[0].date.getTime();

    for (const t of mios) {
      const at = t.consolidadoAt ?? t.createdAt;
      if (!DONE.includes(t.status) || at < weekStart) continue;
      const day = new Date(at);
      day.setHours(0, 0, 0, 0);
      // Sábado y domingo se suman al viernes: se pagan con esa semana.
      const rec = weekRecords.find((r) => r.date.getTime() === day.getTime()) ?? weekRecords[4];
      rec.ordersCount += 1;
      rec.earnings    += calcEarning(t.productSubtotal);
    }

    const today = weekRecords.find((r) => isToday(r.date));
    return {
      weekRecords,
      weeklyEarnings:   weekRecords.reduce((s, r) => s + r.earnings, 0),
      todayEarnings:    today?.earnings    ?? 0,
      todayOrdersCount: today?.ordersCount ?? 0,
      totalOrdersCount: weekRecords.reduce((s, r) => s + r.ordersCount, 0),
    };
  }, [mios]);
}

import { useMemo } from 'react';
import { currentWeekDays, isToday } from '../utils/earnings';
import { useTransportistaDeliveryStore } from './transportistaDeliveryStore';

// ─── Ganancias del transportista ──────────────────────────────────────────────
// Salen de sus entregas reales (las "mias" de transportistaDeliveryStore): cada
// pedido entregado de la semana actual suma el envío que pagó el cliente.

export interface DayRecordT {
  date:            Date;
  deliveriesCount: number;
  totalKm:         number;
  earnings:        number;
}

export function useTransportistaStore() {
  const mias = useTransportistaDeliveryStore((s) => s.mias);

  return useMemo(() => {
    const weekRecords: DayRecordT[] = currentWeekDays().map((date) => ({
      date, deliveriesCount: 0, totalKm: 0, earnings: 0,
    }));
    const weekStart = weekRecords[0].date.getTime();

    for (const d of mias) {
      if (d.status !== 'entregado' || d.createdAt < weekStart) continue;
      const day = new Date(d.createdAt);
      day.setHours(0, 0, 0, 0);
      // Sábado y domingo se suman al viernes: se pagan con esa semana.
      const rec = weekRecords.find((r) => r.date.getTime() === day.getTime()) ?? weekRecords[4];
      rec.deliveriesCount += 1;
      rec.totalKm         += d.distanceKm;
      rec.earnings        += d.earning;
    }

    const today = weekRecords.find((r) => isToday(r.date));
    return {
      weekRecords,
      weeklyEarnings:       weekRecords.reduce((s, r) => s + r.earnings, 0),
      weeklyKm:             weekRecords.reduce((s, r) => s + r.totalKm, 0),
      todayEarnings:        today?.earnings        ?? 0,
      todayDeliveriesCount: today?.deliveriesCount ?? 0,
      todayKm:              today?.totalKm         ?? 0,
      totalDeliveriesCount: weekRecords.reduce((s, r) => s + r.deliveriesCount, 0),
    };
  }, [mias]);
}

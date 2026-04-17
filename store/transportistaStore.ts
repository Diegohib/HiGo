import { create } from 'zustand';
import { calcTransportistaEarning, currentWeekDays, isToday, isPast } from '../utils/earnings';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DeliveryRecord {
  distanceKm: number;
  earning:    number;
}

export interface DayRecordT {
  date:            Date;
  deliveries:      DeliveryRecord[];
  deliveriesCount: number;
  totalKm:         number;
  earnings:        number;
}

// ─── Datos mock: distancias (km) por posición en la semana (0=Lun … 4=Vie) ───
// Cada número representa el km recorrido en una entrega ese día.

const MOCK_BY_DOW: { distances: number[] }[] = [
  { distances: [3.2, 7.5, 2.1, 12.0, 4.8] },     // Lun – 5 entregas
  { distances: [5.5, 8.2, 3.0, 15.0, 6.3] },      // Mar – 5 entregas
  { distances: [2.5, 6.0, 10.5, 4.2, 8.8, 3.5] }, // Mié – 6 entregas
  { distances: [7.0, 4.5, 11.2] },                 // Jue – 3 entregas (hoy)
  { distances: [] },                               // Vie – pendiente
];

function buildWeekRecords(): DayRecordT[] {
  const days = currentWeekDays();
  return days.map((date, idx) => {
    const hasData   = isPast(date) || isToday(date);
    const distances = hasData ? MOCK_BY_DOW[idx].distances : [];
    const deliveries: DeliveryRecord[] = distances.map(km => ({
      distanceKm: km,
      earning:    calcTransportistaEarning(km),
    }));
    const totalKm  = deliveries.reduce((s, d) => s + d.distanceKm, 0);
    const earnings = deliveries.reduce((s, d) => s + d.earning,    0);
    return {
      date,
      deliveries,
      deliveriesCount: deliveries.length,
      totalKm,
      earnings,
    };
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface TransportistaState {
  weekRecords:          DayRecordT[];
  weeklyEarnings:       number;
  weeklyKm:             number;
  todayEarnings:        number;
  todayDeliveriesCount: number;
  todayKm:              number;
  totalDeliveriesCount: number;
  refreshWeek:          () => void;
}

export const useTransportistaStore = create<TransportistaState>((set) => {
  function compute() {
    const records              = buildWeekRecords();
    const today                = records.find(r => isToday(r.date));
    const weeklyEarnings       = records.reduce((s, r) => s + r.earnings,        0);
    const weeklyKm             = records.reduce((s, r) => s + r.totalKm,         0);
    const todayEarnings        = today?.earnings        ?? 0;
    const todayDeliveriesCount = today?.deliveriesCount ?? 0;
    const todayKm              = today?.totalKm         ?? 0;
    const totalDeliveriesCount = records.reduce((s, r) => s + r.deliveriesCount, 0);
    return {
      weekRecords: records, weeklyEarnings, weeklyKm,
      todayEarnings, todayDeliveriesCount, todayKm, totalDeliveriesCount,
    };
  }

  return {
    ...compute(),
    refreshWeek: () => set(compute()),
  };
});

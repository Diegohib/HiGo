import { Order } from './types';
import { startOfWeek } from './utils';

// ─── Finanzas reales por semana ───────────────────────────────────────────────
// Reparto de cada pedido entregado:
//   comerciantes   → el precio de los productos (subtotal)
//   transportistas → el envío completo (shippingCost)
//   cocheros       → la tabla de $1–$6 sobre el subtotal, pagada del 7 %
//   HiGo           → el 7 % de gestión menos lo de los cocheros
// Solo cuentan los pedidos ya entregados; los que siguen en curso se informan
// aparte. Semanas de lunes a domingo, según la fecha del pedido.

// Tabla del cochero (igual a EARNING_TIERS en utils/earnings.ts de la app).
const COCHERO_TIERS = [
  { min: 151, earning: 6 },
  { min: 121, earning: 5 },
  { min: 91,  earning: 4 },
  { min: 61,  earning: 3 },
  { min: 31,  earning: 2 },
  { min: 15,  earning: 1 },
];

export function cocheroEarning(productSubtotal: number): number {
  return COCHERO_TIERS.find((t) => productSubtotal >= t.min)?.earning ?? 0;
}

export interface WeekFinance {
  id: string;
  weekLabel: string;
  weekStart: Date;
  totalIncome: number;
  toComerciantes: number;
  toCocheros: number;
  toTransportistas: number;
  higoGross: number;
  higoNet: number;
  ordersCount: number;
  inProgressCount: number;
  legacyCount: number;
  cashCollected: number;
  current: boolean;
}

const round = (n: number) => Math.round(n * 100) / 100;

function weekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

export function buildWeeks(orders: Order[], count = 8): WeekFinance[] {
  const thisMonday = startOfWeek(new Date());

  return Array.from({ length: count }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - 7 * i);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const ofWeek = orders.filter((o) => o.createdAt >= start.getTime() && o.createdAt < end.getTime());
    const delivered = ofWeek.filter((o) => o.status === 'entregado');

    let totalIncome = 0, toComerciantes = 0, toCocheros = 0, toTransportistas = 0, higoGross = 0, legacyCount = 0, cashCollected = 0;
    for (const o of delivered) {
      totalIncome += o.total;
      if (o.paymentMethod === 'efectivo') cashCollected += o.total;
      if (o.subtotal == null) {
        // Pedido viejo sin desglose: todo se cuenta como productos.
        legacyCount++;
        toComerciantes += o.total;
        if (o.operatorRole === 'cochero') toCocheros += cocheroEarning(o.total);
        continue;
      }
      toComerciantes += o.subtotal;
      toTransportistas += o.shippingCost ?? 0;
      higoGross += o.managementFee ?? 0;
      toCocheros += cocheroEarning(o.subtotal);
    }

    return {
      id: start.toISOString(),
      weekLabel: weekLabel(start),
      weekStart: start,
      totalIncome: round(totalIncome),
      toComerciantes: round(toComerciantes),
      toCocheros: round(toCocheros),
      toTransportistas: round(toTransportistas),
      higoGross: round(higoGross),
      higoNet: round(higoGross - toCocheros),
      ordersCount: delivered.length,
      inProgressCount: ofWeek.length - delivered.length,
      legacyCount,
      cashCollected: round(cashCollected),
      current: i === 0,
    };
  });
}

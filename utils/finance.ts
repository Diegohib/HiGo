import { Order } from '../store/ordersStore';
import { calcEarning } from './earnings';

// ─── Finanzas reales por semana ───────────────────────────────────────────────
// Se arman a partir de los pedidos (ver el desglose en store/ordersStore.ts):
//   comerciantes   → el precio de los productos (subtotal)
//   transportistas → el envío completo (shippingCost)
//   cocheros       → la tabla de $1–$6 sobre el subtotal, pagada del 7 %
//   HiGo           → el 7 % de gestión menos lo de los cocheros
// Solo cuentan los pedidos ya entregados; los que siguen en curso se informan
// aparte. Semanas de lunes a domingo, según la fecha del pedido.
// (admin-web/src/finance.ts repite este mismo cálculo para el panel web.)

export interface WeekFinance {
  id:               string;
  weekLabel:        string;
  weekStart:        Date;
  totalIncome:      number;
  toComerciantes:   number;
  toCocheros:       number;
  toTransportistas: number;
  higoGross:        number;   // 7 % de gestión cobrado
  higoNet:          number;   // higoGross - toCocheros
  ordersCount:      number;   // entregados
  inProgressCount:  number;   // todavía no entregados
  legacyCount:      number;   // entregados de antes del desglose (sin datos de gestión/envío)
  cashCollected:    number;   // efectivo que cobraron los transportistas (se descuenta de su pago)
  status:           'pendiente' | 'cerrada';
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function mondayOf(d: Date): Date {
  const m = new Date(d);
  const dow = m.getDay();
  m.setDate(m.getDate() + (dow === 0 ? -6 : 1 - dow));
  m.setHours(0, 0, 0, 0);
  return m;
}

function weekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function buildWeeks(orders: Order[], count = 8): WeekFinance[] {
  const thisMonday = mondayOf(new Date());

  return Array.from({ length: count }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - 7 * i);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const ofWeek    = orders.filter((o) => o.createdAt >= start.getTime() && o.createdAt < end.getTime());
    const delivered = ofWeek.filter((o) => o.status === 'entregado');

    let totalIncome = 0, toComerciantes = 0, toCocheros = 0, toTransportistas = 0, higoGross = 0, legacyCount = 0, cashCollected = 0;
    for (const o of delivered) {
      totalIncome += o.total;
      if (o.paymentMethod === 'efectivo') cashCollected += o.total;
      if (o.subtotal == null) {
        // Pedido viejo sin desglose: no se sabe cuánto fue gestión ni envío,
        // así que todo se cuenta como productos.
        legacyCount++;
        toComerciantes += o.total;
        if (o.operatorRole === 'cochero') toCocheros += calcEarning(o.total);
        continue;
      }
      toComerciantes   += o.subtotal;
      toTransportistas += o.shippingCost ?? 0;
      higoGross        += o.managementFee ?? 0;
      toCocheros       += calcEarning(o.subtotal);
    }

    return {
      id:               start.toISOString(),
      weekLabel:        weekLabel(start),
      weekStart:        start,
      totalIncome:      round(totalIncome),
      toComerciantes:   round(toComerciantes),
      toCocheros:       round(toCocheros),
      toTransportistas: round(toTransportistas),
      higoGross:        round(higoGross),
      higoNet:          round(higoGross - toCocheros),
      ordersCount:      delivered.length,
      inProgressCount:  ofWeek.length - delivered.length,
      legacyCount,
      cashCollected:    round(cashCollected),
      status:           i === 0 ? 'pendiente' : 'cerrada',
    };
  });
}

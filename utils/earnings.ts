// ─── Tarifas cochero ──────────────────────────────────────────────────────────
// Pedido $15-$25 → $1.50 | $25-$50 → $3.00 | $50-$75 → $4.50
// $75-$100 → $6.00 | >$100 → $7.00

export interface EarningTier {
  label:   string;
  min:     number;
  max:     number | null; // null = sin límite superior
  earning: number;
}

export const EARNING_TIERS: EarningTier[] = [
  { label: '$15 – $25',   min:  15, max:  25,  earning: 1.50 },
  { label: '$25 – $50',   min:  25, max:  50,  earning: 3.00 },
  { label: '$50 – $75',   min:  50, max:  75,  earning: 4.50 },
  { label: '$75 – $100',  min:  75, max: 100,  earning: 6.00 },
  { label: 'Más de $100', min: 100, max: null, earning: 7.00 },
];

/** Calcula la ganancia del cochero por un pedido según su total. */
export function calcEarning(orderTotal: number): number {
  for (const tier of [...EARNING_TIERS].reverse()) {
    if (orderTotal >= tier.min) return tier.earning;
  }
  return 0; // pedido menor a $15 (no debería ocurrir)
}

// ─── Tarifas transportista ────────────────────────────────────────────────────
// Ganancia por entrega = base fija + tarifa por km recorrido

export const TRANSPORTISTA_BASE   = 2.00;  // $ por entrega
export const TRANSPORTISTA_PER_KM = 0.45;  // $ por km adicional

/** Calcula la ganancia del transportista por una entrega según la distancia. */
export function calcTransportistaEarning(distanceKm: number): number {
  return TRANSPORTISTA_BASE + TRANSPORTISTA_PER_KM * distanceKm;
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Lunes a viernes de la semana actual. */
export function currentWeekDays(): Date[] {
  const today = new Date();
  const dow   = today.getDay(); // 0=Dom … 6=Sáb
  // Días desde el lunes (domingo = -6 para ir al lunes anterior)
  const fromMonday = dow === 0 ? -6 : 1 - dow;
  return [0, 1, 2, 3, 4].map(i => {
    const d = new Date(today);
    d.setDate(today.getDate() + fromMonday + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

/** Próximo viernes de pago (si hoy es viernes, devuelve hoy). */
export function nextPayFriday(): Date {
  const today = new Date();
  const dow   = today.getDay();
  const daysUntil = (5 - dow + 7) % 7; // 0 si hoy es viernes
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntil);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

/** Formatea como "Vie 17 abr" */
export function formatShortDate(d: Date): string {
  return `${DAY_NAMES_ES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES_ES[d.getMonth()]}`;
}

/** Devuelve true si la fecha es hoy. */
export function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

/** Devuelve true si la fecha ya pasó (no es hoy). */
export function isPast(d: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

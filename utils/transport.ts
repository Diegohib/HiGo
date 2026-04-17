// ─── Origen: Mercado Mayorista de Quito ──────────────────────────────────────

export const WAREHOUSE_LAT = -0.2105;
export const WAREHOUSE_LNG = -78.4900;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type VehicleType = 'moto' | 'taxi' | 'camioneta';

export interface TransportInfo {
  vehicle:      VehicleType;
  vehicleLabel: string;
  vehicleEmoji: string;
  distanceKm:   number;
  cost:         number;
}

// Rangos de peso y tarifas
//   < 30 lbs  → moto:      base $1.50 + $0.40/km
//   30–150 lbs → taxi:     base $2.00 + $0.50/km
//   > 150 lbs  → camioneta: base $3.00 + $0.70/km

const VEHICLES: Array<{
  maxLbs:  number;
  type:    VehicleType;
  label:   string;
  emoji:   string;
  base:    number;
  perKm:   number;
}> = [
  { maxLbs:  30, type: 'moto',      label: 'Moto',      emoji: '🛵', base: 1.50, perKm: 0.40 },
  { maxLbs: 150, type: 'taxi',      label: 'Taxi',      emoji: '🚕', base: 2.00, perKm: 0.50 },
  { maxLbs: Infinity, type: 'camioneta', label: 'Camioneta', emoji: '🚛', base: 3.00, perKm: 0.70 },
];

// ─── Fórmula Haversine ────────────────────────────────────────────────────────

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371; // radio de la Tierra en km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ─── Calculador de transporte ─────────────────────────────────────────────────

export function calcTransport(
  totalWeightLbs: number,
  clientLat:      number,
  clientLng:      number,
): TransportInfo {
  const distanceKm = haversineKm(WAREHOUSE_LAT, WAREHOUSE_LNG, clientLat, clientLng);

  const v = VEHICLES.find(x => totalWeightLbs < x.maxLbs) ?? VEHICLES[VEHICLES.length - 1];

  return {
    vehicle:      v.type,
    vehicleLabel: v.label,
    vehicleEmoji: v.emoji,
    distanceKm,
    cost: v.base + v.perKm * distanceKm,
  };
}

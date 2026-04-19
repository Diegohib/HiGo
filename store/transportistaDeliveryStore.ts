import { create } from 'zustand';
import { calcTransportistaEarning } from '../utils/earnings';
import { WAREHOUSE_LAT, WAREHOUSE_LNG, VehicleType } from '../utils/transport';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DeliveryStatus = 'pendiente' | 'en_camino' | 'entregado';

export interface Delivery {
  id:           string;
  clientName:   string;
  address:      string;
  distanceKm:   number;
  vehicle:      VehicleType;
  vehicleEmoji: string;
  vehicleLabel: string;
  earning:      number;
  status:       DeliveryStatus;
  timeSlot:     string;
  lat:          number;
  lng:          number;
}

// ─── Mock entregas del día ────────────────────────────────────────────────────

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: '001234',
    clientName:   'Ana Torres',
    address:      'Calle Oe1 N24-56, La Floresta, Quito',
    distanceKm:   4.2,
    vehicle:      'moto',
    vehicleEmoji: '🛵',
    vehicleLabel: 'Moto',
    earning:      calcTransportistaEarning(4.2),
    status:       'pendiente',
    timeSlot:     '10:00 - 12:00',
    lat:          -0.1907,
    lng:          -78.4820,
  },
  {
    id: '001235',
    clientName:   'Marco Ruiz',
    address:      'Av. Eloy Alfaro N32-28, Iñaquito, Quito',
    distanceKm:   7.8,
    vehicle:      'taxi',
    vehicleEmoji: '🚕',
    vehicleLabel: 'Taxi',
    earning:      calcTransportistaEarning(7.8),
    status:       'pendiente',
    timeSlot:     '10:00 - 12:00',
    lat:          -0.1645,
    lng:          -78.4870,
  },
  {
    id: '001236',
    clientName:   'Sofía Mendez',
    address:      'Calle Rumipamba E5-45, Bellavista, Quito',
    distanceKm:   12.5,
    vehicle:      'taxi',
    vehicleEmoji: '🚕',
    vehicleLabel: 'Taxi',
    earning:      calcTransportistaEarning(12.5),
    status:       'pendiente',
    timeSlot:     '14:00 - 16:00',
    lat:          -0.1780,
    lng:          -78.5050,
  },
  {
    id: '001237',
    clientName:   'Diego Vargas',
    address:      'Av. Occidental S/N, Chillogallo, Quito',
    distanceKm:   19.3,
    vehicle:      'camioneta',
    vehicleEmoji: '🚛',
    vehicleLabel: 'Camioneta',
    earning:      calcTransportistaEarning(19.3),
    status:       'pendiente',
    timeSlot:     '14:00 - 16:00',
    lat:          -0.2850,
    lng:          -78.5210,
  },
];

// ─── Constantes del almacén ───────────────────────────────────────────────────

export { WAREHOUSE_LAT, WAREHOUSE_LNG };

// ─── Store ────────────────────────────────────────────────────────────────────

interface TransportistaDeliveryState {
  deliveries:       Delivery[];
  disponible:       boolean;
  toggleDisponible: () => void;
  iniciarEntrega:   (id: string) => void;
  confirmarEntrega: (id: string) => void;
}

export const useTransportistaDeliveryStore = create<TransportistaDeliveryState>((set) => ({
  deliveries:  MOCK_DELIVERIES,
  disponible:  true,

  toggleDisponible: () =>
    set((s) => ({ disponible: !s.disponible })),

  iniciarEntrega: (id) =>
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id ? { ...d, status: 'en_camino' } : d
      ),
    })),

  confirmarEntrega: (id) =>
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id ? { ...d, status: 'entregado' } : d
      ),
    })),
}));

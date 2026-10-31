import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { StallTicket, toStallTicket } from './stallTicketsStore';
import { nextPayFriday, formatShortDate, isToday, isPast } from '../utils/earnings';

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Los despachos del comerciante son los tickets reales de su puesto (colección
// "stallTickets", ver stallTicketsStore): uno por cada pedido que incluye
// productos suyos.

export interface DaySale {
  date:      Date;
  dayLabel:  string;
  shortDate: string;
  orders:    number;
  amount:    number;
}

// ─── Ventas: semana actual (lunes a sábado) ───────────────────────────────────
// Cuenta lo ya retirado (lo que el puesto efectivamente entregó), por el día
// en que se retiró. Los días futuros de la semana quedan en 0.

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function currentWeekDaysMonToSat(): Date[] {
  const today = new Date();
  const dow   = today.getDay(); // 0=Dom … 6=Sáb
  const fromMonday = dow === 0 ? -6 : 1 - dow;
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + fromMonday + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function buildWeekSales(tickets: StallTicket[]): DaySale[] {
  return currentWeekDaysMonToSat().map((date, i) => {
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    const ofDay = (isPast(date) || isToday(date))
      ? tickets.filter((t) =>
          t.status === 'retirado' && t.retiradoAt != null &&
          t.retiradoAt >= date.getTime() && t.retiradoAt < next.getTime())
      : [];
    return {
      date,
      dayLabel:  DAY_LABELS[i],
      shortDate: formatShortDate(date),
      orders:    ofDay.length,
      amount:    ofDay.reduce((s, t) => s + t.subtotal, 0),
    };
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ComercianteState {
  dispatchTickets: StallTicket[];
  loaded:          boolean;
  weeklySales:     DaySale[];
  fridayBalance:   number;
  fridayDate:      Date;
  disponible:      boolean;
  toggleDisponible: () => void;
}

export const useComercianteStore = create<ComercianteState>()(
  persist(
    (set) => ({
      dispatchTickets: [],
      loaded:          false,
      weeklySales:     buildWeekSales([]),
      fridayBalance:   0,
      fridayDate:      nextPayFriday(),
      disponible:      true,

      toggleDisponible: () =>
        set((s) => ({ disponible: !s.disponible })),
    }),
    {
      name: 'higo-comerciante-v3',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se recuerda el interruptor; los despachos llegan en vivo.
      partialize: (s) => ({ disponible: s.disponible }),
    }
  )
);

// ─── Suscripción en vivo (solo mientras la sesión sea de un comerciante) ──────

let unsubTickets: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const isComerciante = state.user?.role === 'comerciante' && state.user.status === 'approved';

  if (isComerciante && !unsubTickets) {
    unsubTickets = onSnapshot(
      query(collection(db, 'stallTickets'), where('comercianteUid', '==', state.user!.uid)),
      (snap) => {
        // Los de transferencias sin confirmar todavía no se preparan.
        const tickets = snap.docs
          .filter((d) => d.data().released !== false)
          .map((d) => toStallTicket(d.id, d.data()))
          .sort((a, b) => b.createdAt - a.createdAt);
        const weeklySales = buildWeekSales(tickets);
        useComercianteStore.setState({
          dispatchTickets: tickets,
          loaded:          true,
          weeklySales,
          fridayBalance:   parseFloat(weeklySales.reduce((s, d) => s + d.amount, 0).toFixed(2)),
          fridayDate:      nextPayFriday(),
        });
      }
    );
  } else if (!isComerciante && unsubTickets) {
    unsubTickets();
    unsubTickets = null;
    useComercianteStore.setState({ dispatchTickets: [], loaded: false, weeklySales: buildWeekSales([]), fridayBalance: 0 });
  }
});

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Solicitud } from './adminSolicitudesStore';

export interface ClienteUser {
  name: string;
  email: string;
  phone: string;
  role: 'cliente';
}

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  role: 'cochero' | 'transportista' | 'comerciante';
  cedula?: string;
  numCoche?: string;
  stallNumber?: string;
}

interface AuthState {
  user: ClienteUser | StaffUser | null;
  register: (user: ClienteUser) => void;
  staffLogin: (solicitud: Solicitud) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      register: (user) => set({ user }),
      staffLogin: (solicitud) =>
        set({
          user: {
            id:          solicitud.id,
            name:        solicitud.name,
            phone:       solicitud.phone,
            role:        solicitud.role,
            cedula:      solicitud.extraData?.cedula,
            numCoche:    solicitud.extraData?.numCoche,
            stallNumber: solicitud.extraData?.stallNumber,
          },
        }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'higo-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

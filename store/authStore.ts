import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClienteUser {
  name: string;
  email: string;
  phone: string;
  role: 'cliente';
}

interface AuthState {
  user: ClienteUser | null;
  register: (user: ClienteUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      register: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'higo-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

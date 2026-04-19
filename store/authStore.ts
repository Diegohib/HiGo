import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  register: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

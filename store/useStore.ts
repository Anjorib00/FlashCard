import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthReady: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAuthReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthReady: false,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
}));

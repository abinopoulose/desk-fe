import { create } from 'zustand';
import { UserDTO } from '../types/auth';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  login: (user: UserDTO) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  register: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      register: async (email, password, name) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Registration failed');
          }
          const data = await res.json();
          localStorage.setItem('auth-token', data.token);
          set({ user: data.user, token: data.token, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
          }
          const data = await res.json();
          localStorage.setItem('auth-token', data.token);
          set({ user: data.user, token: data.token, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),

      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

import { create } from 'zustand';
import { repositories } from '../repositories';
import { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: Profile | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user, loading: false }),
  initialize: async () => {
    try {
      const user = await repositories.auth.getCurrentUser();
      set({ user, initialized: true, loading: false });
      
      // Listen for auth state changes
      repositories.auth.onAuthStateChange((updatedUser) => {
        set({ user: updatedUser, loading: false });
      });
    } catch (e) {
      console.error('Failed to initialize auth store:', e);
      set({ initialized: true, loading: false });
    }
  },
  signIn: async (email: string) => {
    set({ loading: true });
    const { user, error } = await repositories.auth.signIn(email, 'password123');
    if (error) {
      set({ loading: false });
      throw new Error(error);
    }
    set({ user, loading: false });
  },
  signOut: async () => {
    set({ loading: true });
    try {
      await repositories.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      set({ user: null, loading: false });
    }
  },
}));

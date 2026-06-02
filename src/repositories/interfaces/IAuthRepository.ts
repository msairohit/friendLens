// ============================================================
// IAuthRepository — Authentication operations contract
// ============================================================

import { AuthResult, Profile } from '../../types';

export interface IAuthRepository {
  /** Register a new user with email and password */
  signUp(email: string, password: string): Promise<AuthResult>;

  /** Sign in with email and password */
  signIn(email: string, password: string): Promise<AuthResult>;

  /** Sign in with Google OAuth (Android) */
  signInWithGoogle(): Promise<AuthResult>;

  /** Sign the current user out */
  signOut(): Promise<void>;

  /** Get the currently authenticated user's profile */
  getCurrentUser(): Promise<Profile | null>;

  /** Listen for auth state changes. Returns an unsubscribe function. */
  onAuthStateChange(callback: (user: Profile | null) => void): () => void;

  /** Update a user's profile fields */
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>;
}

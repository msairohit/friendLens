// ============================================================
// SupabaseAuthRepository — Supabase implementation of IAuthRepository
// ============================================================

import { supabase } from '../../lib/supabase';
import { IAuthRepository } from '../interfaces/IAuthRepository';
import { AuthResult, Profile } from '../../types';

export class SupabaseAuthRepository implements IAuthRepository {
  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    let profile: Profile | null = null;
    if (data.user) {
      // Create a profile row for the new user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          username: email.split('@')[0], // default username
          display_name: email.split('@')[0],
        })
        .select()
        .single();

      if (profileError) {
        console.warn('Profile creation error:', profileError.message);
      } else {
        profile = this.mapProfile(profileData);
      }
    }

    return {
      user: profile,
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at ?? 0,
          }
        : null,
      error: null,
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    const profile = data.user ? await this.getProfileById(data.user.id) : null;

    return {
      user: profile,
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at ?? 0,
          }
        : null,
      error: null,
    };
  }

  async signInWithGoogle(): Promise<AuthResult> {
    // TODO: Implement Google OAuth for Android using expo-auth-session
    // This requires additional setup with Google Cloud Console
    return { user: null, session: null, error: 'Google sign-in not yet implemented' };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getCurrentUser(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getProfileById(user.id);
  }

  onAuthStateChange(callback: (user: Profile | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await this.getProfileById(session.user.id);
          callback(profile);
        } else {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  async updateProfile(
    userId: string,
    data: Partial<Profile>
  ): Promise<Profile> {
    const updateData: Record<string, unknown> = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.phoneHash !== undefined) updateData.phone_hash = data.phoneHash;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapProfile(result);
  }

  // ---- Private Helpers ----

  private async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapProfile(data);
  }

  private mapProfile(row: Record<string, unknown>): Profile {
    return {
      id: row.id as string,
      username: row.username as string,
      displayName: (row.display_name as string) || '',
      avatarUrl: (row.avatar_url as string) || null,
      phoneHash: (row.phone_hash as string) || null,
      email: (row.email as string) || '',
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

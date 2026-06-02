// ============================================================
// SupabaseConnectionRepository — Supabase implementation of IConnectionRepository
// ============================================================

import { supabase } from '../../lib/supabase';
import { IConnectionRepository } from '../interfaces/IConnectionRepository';
import { Connection, Profile } from '../../types';

export class SupabaseConnectionRepository implements IConnectionRepository {
  async sendRequest(requesterId: string, addresseeId: string): Promise<Connection> {
    const { data, error } = await supabase
      .from('connections')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapConnection(data);
  }

  async acceptRequest(connectionId: string): Promise<Connection> {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapConnection(data);
  }

  async rejectRequest(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw new Error(error.message);
  }

  async blockUser(userId: string, blockedId: string): Promise<void> {
    // Check if connection exists
    const existing = await this.getConnectionBetween(userId, blockedId);

    if (existing) {
      // Update existing connection to blocked
      await supabase
        .from('connections')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Create a new blocked connection
      await supabase.from('connections').insert({
        requester_id: userId,
        addressee_id: blockedId,
        status: 'blocked',
      });
    }
  }

  async removeConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw new Error(error.message);
  }

  async getFriends(userId: string): Promise<Profile[]> {
    // Friends are connections where status is 'accepted' and user is on either side
    const { data, error } = await supabase
      .from('connections')
      .select(`
        requester_id,
        addressee_id,
        requester:profiles!connections_requester_id_fkey(*),
        addressee:profiles!connections_addressee_id_fkey(*)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) throw new Error(error.message);

    return (data || []).map((row: Record<string, unknown>) => {
      // Return the OTHER user's profile (not the current user)
      if ((row.requester_id as string) === userId) {
        return this.mapProfile(row.addressee as Record<string, unknown>);
      }
      return this.mapProfile(row.requester as Record<string, unknown>);
    });
  }

  async getPendingRequests(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapConnection);
  }

  async getSentRequests(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapConnection);
  }

  async findUsersFromContacts(phoneHashes: string[]): Promise<Profile[]> {
    if (phoneHashes.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('phone_hash', phoneHashes);

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapProfile);
  }

  async getConnectionBetween(
    userIdA: string,
    userIdB: string
  ): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(requester_id.eq.${userIdA},addressee_id.eq.${userIdB}),and(requester_id.eq.${userIdB},addressee_id.eq.${userIdA})`
      )
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapConnection(data);
  }

  // ---- Private Helpers ----

  private mapConnection(row: Record<string, unknown>): Connection {
    return {
      id: row.id as string,
      requesterId: row.requester_id as string,
      addresseeId: row.addressee_id as string,
      status: row.status as Connection['status'],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
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

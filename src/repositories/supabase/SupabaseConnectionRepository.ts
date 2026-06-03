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

    // Create a notification for the recipient
    try {
      await supabase.from('notifications').insert({
        user_id: addresseeId,
        sender_id: requesterId,
        type: 'friend_request',
        is_read: false,
      });
    } catch (err) {
      console.error('Failed to create friend_request notification:', err);
    }

    return this.mapConnection(data);
  }

  async acceptRequest(connectionId: string): Promise<Connection> {
    // Get connection details first to know the requester
    const { data: conn, error: getErr } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (getErr) throw new Error(getErr.message);

    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create notification for requester (sender) that B accepted it
    try {
      await supabase.from('notifications').insert({
        user_id: conn.requester_id,
        sender_id: conn.addressee_id,
        type: 'request_accepted',
        is_read: false,
      });
    } catch (err) {
      console.error('Failed to create request_accepted notification:', err);
    }

    return this.mapConnection(data);
  }

  async rejectRequest(connectionId: string): Promise<void> {
    // Get connection details first to know the requester
    const { data: conn, error: getErr } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (getErr) throw new Error(getErr.message);

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw new Error(error.message);

    // Create notification for requester (sender) that B rejected it
    try {
      await supabase.from('notifications').insert({
        user_id: conn.requester_id,
        sender_id: conn.addressee_id,
        type: 'request_rejected',
        is_read: false,
      });
    } catch (err) {
      console.error('Failed to create request_rejected notification:', err);
    }
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

  async getPendingRequests(userId: string): Promise<(Connection & { requester: Profile })[]> {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      ...this.mapConnection(row),
      requester: this.mapProfile(row.requester)
    }));
  }

  async getSentRequests(userId: string): Promise<(Connection & { addressee: Profile })[]> {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        addressee:profiles!connections_addressee_id_fkey(*)
      `)
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      ...this.mapConnection(row),
      addressee: this.mapProfile(row.addressee)
    }));
  }

  async findUsersFromContacts(phones: string[]): Promise<Profile[]> {
    if (phones.length === 0) return [];

    // Clean and get last 10 digits of input phone numbers
    const searchLast10 = phones.map(p => {
      const clean = p.replace(/[^\d]/g, '');
      return clean.length >= 10 ? clean.slice(-10) : clean;
    }).filter(p => p.length >= 7); // minimum digits for a phone number

    if (searchLast10.length === 0) return [];

    // Fetch all profiles that have a phone number
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('phone', 'is', null);

    if (error) throw new Error(error.message);

    // Filter in-memory by comparing the last 10 digits of the profile's phone
    const matched = (data || []).filter((profile: any) => {
      if (!profile.phone) return false;
      const profileClean = profile.phone.replace(/[^\d]/g, '');
      const profileLast10 = profileClean.length >= 10 ? profileClean.slice(-10) : profileClean;
      return searchLast10.includes(profileLast10);
    });

    return matched.map(this.mapProfile);
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

  async searchByFriendTag(tag: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('friend_tag', tag.toLowerCase())
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapProfile(data);
  }

  async searchUsersByUsername(query: string, currentUserId: string): Promise<Profile[]> {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `${query}%`)
      .neq('id', currentUserId)
      .limit(20);

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapProfile);
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
      phone: (row.phone as string) || null,
      email: (row.email as string) || '',
      friendTag: (row.friend_tag as string) || '',
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

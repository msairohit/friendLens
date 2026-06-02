// ============================================================
// SupabaseSharingRepository — Supabase implementation of ISharingRepository
// ============================================================

import { supabase } from '../../lib/supabase';
import { ISharingRepository } from '../interfaces/ISharingRepository';
import { SharingPermission, CreateSharingPermissionInput } from '../../types';

export class SupabaseSharingRepository implements ISharingRepository {
  async getPermission(
    ownerId: string,
    viewerId: string
  ): Promise<SharingPermission | null> {
    const { data, error } = await supabase
      .from('sharing_permissions')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('viewer_id', viewerId)
      .single();

    if (error || !data) return null;
    return this.mapPermission(data);
  }

  async setPermission(
    permission: CreateSharingPermissionInput
  ): Promise<SharingPermission> {
    // Upsert — update if exists, insert if not
    const { data, error } = await supabase
      .from('sharing_permissions')
      .upsert(
        {
          owner_id: permission.ownerId,
          viewer_id: permission.viewerId,
          share_level: permission.shareLevel,
          anonymous_friends: permission.anonymousFriends,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'owner_id,viewer_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapPermission(data);
  }

  async getPermissionsForUser(ownerId: string): Promise<SharingPermission[]> {
    const { data, error } = await supabase
      .from('sharing_permissions')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapPermission);
  }

  async deletePermission(ownerId: string, viewerId: string): Promise<void> {
    const { error } = await supabase
      .from('sharing_permissions')
      .delete()
      .eq('owner_id', ownerId)
      .eq('viewer_id', viewerId);

    if (error) throw new Error(error.message);
  }

  // ---- Private Helpers ----

  private mapPermission(row: Record<string, unknown>): SharingPermission {
    return {
      id: row.id as string,
      ownerId: row.owner_id as string,
      viewerId: row.viewer_id as string,
      shareLevel: row.share_level as SharingPermission['shareLevel'],
      anonymousFriends: row.anonymous_friends as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

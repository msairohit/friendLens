// ============================================================
// SupabaseItemRepository — Supabase implementation of IItemRepository
// ============================================================

import { supabase } from '../../lib/supabase';
import { IItemRepository } from '../interfaces/IItemRepository';
import { Item, CreateItemInput } from '../../types';

export class SupabaseItemRepository implements IItemRepository {
  async findOrCreate(item: CreateItemInput): Promise<Item> {
    // Try to find by external ID first (if provided)
    if (item.externalId) {
      const existing = await this.getByExternalId(item.externalId);
      if (existing) return existing;
    }

    // Try to find by exact title + type match
    const { data: existingByTitle } = await supabase
      .from('items')
      .select('*')
      .eq('title', item.title)
      .eq('type', item.type)
      .limit(1)
      .single();

    if (existingByTitle) return this.mapItem(existingByTitle);

    // Create new item
    const { data, error } = await supabase
      .from('items')
      .insert({
        title: item.title,
        type: item.type,
        external_id: item.externalId || null,
        poster_url: item.posterUrl || null,
        description: item.description || null,
        release_year: item.releaseYear || null,
        metadata: item.metadata || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapItem(data);
  }

  async getById(id: string): Promise<Item | null> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapItem(data);
  }

  async getByExternalId(externalId: string): Promise<Item | null> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (error || !data) return null;
    return this.mapItem(data);
  }

  async searchByTitle(query: string, type?: string): Promise<Item[]> {
    let queryBuilder = supabase
      .from('items')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder;

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapItem);
  }

  // ---- Private Helpers ----

  private mapItem(row: Record<string, unknown>): Item {
    return {
      id: row.id as string,
      title: row.title as string,
      type: row.type as Item['type'],
      externalId: (row.external_id as string) || null,
      posterUrl: (row.poster_url as string) || null,
      description: (row.description as string) || null,
      releaseYear: (row.release_year as number) || null,
      metadata: (row.metadata as Record<string, unknown>) || null,
      createdAt: row.created_at as string,
    };
  }
}

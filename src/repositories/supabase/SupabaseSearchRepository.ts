// ============================================================
// SupabaseSearchRepository — Supabase implementation of ISearchRepository
// Designed to be swappable with Elasticsearch for better full-text search
// ============================================================

import { supabase } from '../../lib/supabase';
import { ISearchRepository } from '../interfaces/ISearchRepository';
import { SearchFilters, SearchResult, NetworkSearchResult } from '../../types';

export class SupabaseSearchRepository implements ISearchRepository {
  async searchItems(
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    let queryBuilder = supabase
      .from('items')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (filters?.type) {
      queryBuilder = queryBuilder.eq('type', filters.type);
    }

    const { data: items, error } = await queryBuilder;

    if (error) throw new Error(error.message);
    if (!items || items.length === 0) return [];

    // For each item, get the review count and average rating
    const itemIds = items.map((item: Record<string, unknown>) => item.id as string);

    const { data: reviewStats, error: statsError } = await supabase
      .from('reviews')
      .select('item_id, rating')
      .in('item_id', itemIds);

    if (statsError) throw new Error(statsError.message);

    // Aggregate stats per item
    const statsMap = new Map<string, { count: number; totalRating: number }>();
    (reviewStats || []).forEach((row: Record<string, unknown>) => {
      const itemId = row.item_id as string;
      const existing = statsMap.get(itemId) || { count: 0, totalRating: 0 };
      existing.count++;
      existing.totalRating += row.rating as number;
      statsMap.set(itemId, existing);
    });

    return items.map((item: Record<string, unknown>) => {
      const stats = statsMap.get(item.id as string);
      return {
        item: {
          id: item.id as string,
          title: item.title as string,
          type: item.type as SearchResult['item']['type'],
          externalId: (item.external_id as string) || null,
          posterUrl: (item.poster_url as string) || null,
          description: (item.description as string) || null,
          releaseYear: (item.release_year as number) || null,
          metadata: (item.metadata as Record<string, unknown>) || null,
          createdAt: item.created_at as string,
        },
        networkReviewCount: stats?.count || 0,
        averageRating: stats
          ? Math.round((stats.totalRating / stats.count) * 10) / 10
          : null,
      };
    });
  }

  async searchNetworkReviews(
    userId: string,
    query: string,
    filters?: SearchFilters
  ): Promise<NetworkSearchResult[]> {
    // Use the RPC function for network-aware search
    const { data, error } = await supabase.rpc('search_network_reviews', {
      p_user_id: userId,
      p_search_query: query,
      p_type_filter: filters?.type || null,
    });

    if (error) {
      // Fallback to basic search if RPC not yet created
      console.warn('Network search RPC not available, falling back to basic search:', error.message);
      const basicResults = await this.searchItems(query, filters);
      return basicResults.map((result) => ({
        ...result,
        reviews: [],
      }));
    }

    // Group results by item
    const itemMap = new Map<string, NetworkSearchResult>();

    (data || []).forEach((row: Record<string, unknown>) => {
      const itemTitle = row.item_title as string;
      const key = itemTitle.toLowerCase();

      if (!itemMap.has(key)) {
        itemMap.set(key, {
          item: {
            id: '',
            title: itemTitle,
            type: row.item_type as NetworkSearchResult['item']['type'],
            externalId: null,
            posterUrl: (row.item_poster_url as string) || null,
            description: null,
            releaseYear: (row.item_release_year as number) || null,
            metadata: null,
            createdAt: '',
          },
          networkReviewCount: 0,
          averageRating: null,
          reviews: [],
        });
      }

      const entry = itemMap.get(key)!;
      entry.networkReviewCount++;
      entry.reviews.push({
        reviewId: row.review_id as string,
        reviewerName: (row.reviewer_name as string) || 'Unknown',
        reviewerPseudonym: (row.reviewer_pseudonym as string) || null,
        isAnonymous: row.is_anonymous as boolean,
        itemTitle,
        itemType: row.item_type as NetworkSearchResult['item']['type'],
        rating: row.rating as number,
        comment: (row.comment as string) || null,
        depth: row.depth as number,
      });

      // Recalculate average
      const totalRating = entry.reviews.reduce((sum, r) => sum + r.rating, 0);
      entry.averageRating = Math.round((totalRating / entry.reviews.length) * 10) / 10;
    });

    return Array.from(itemMap.values());
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];

    const { data, error } = await supabase
      .from('items')
      .select('title')
      .ilike('title', `%${query}%`)
      .limit(8);

    if (error) return [];
    return (data || []).map((row: Record<string, unknown>) => row.title as string);
  }
}

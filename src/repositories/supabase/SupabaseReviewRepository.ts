// ============================================================
// SupabaseReviewRepository — Supabase implementation of IReviewRepository
// ============================================================

import { supabase } from '../../lib/supabase';
import { IReviewRepository } from '../interfaces/IReviewRepository';
import {
  Review,
  CreateReviewInput,
  PaginationOptions,
  PaginatedResult,
  FeedReview,
  FeedOptions,
  NetworkReview,
} from '../../types';

export class SupabaseReviewRepository implements IReviewRepository {
  async create(userId: string, review: CreateReviewInput): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        item_id: review.itemId,
        rating: review.rating,
        comment: review.comment || null,
        link: review.link || null,
        is_public: review.isPublic ?? false,
        sharing_level: review.sharingLevel ?? (review.isPublic ? 4 : 1),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapReview(data);
  }

  async update(id: string, data: Partial<CreateReviewInput>): Promise<Review> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.isPublic !== undefined) {
      updateData.is_public = data.isPublic;
      if (data.sharingLevel === undefined) {
        updateData.sharing_level = data.isPublic ? 4 : 1;
      }
    }
    if (data.sharingLevel !== undefined) updateData.sharing_level = data.sharingLevel;

    const { data: result, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapReview(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getById(id: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapReview(data);
  }

  async getByUserId(
    userId: string,
    options: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Review>> {
    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(this.mapReview),
      total: count || 0,
      page: options.page,
      pageSize: options.pageSize,
      hasMore: (count || 0) > from + (data?.length || 0),
    };
  }

  async getByItemId(
    itemId: string,
    options: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Review>> {
    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(this.mapReview),
      total: count || 0,
      page: options.page,
      pageSize: options.pageSize,
      hasMore: (count || 0) > from + (data?.length || 0),
    };
  }

  async getFeedReviews(
    userId: string,
    options: FeedOptions = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<FeedReview>> {
    // Use the Supabase RPC function for network feed
    const { data, error } = await supabase.rpc('get_network_reviews', {
      p_user_id: userId,
      p_depth: 2,
      p_item_type: options.typeFilter || null,
    });

    if (error) throw new Error(error.message);

    const feedReviews: FeedReview[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.review_id as string,
      userId: '',
      itemId: '',
      rating: row.rating as number,
      comment: (row.comment as string) || null,
      link: null,
      isPublic: true,
      sharingLevel: (row.sharing_level as number) ?? 1,
      createdAt: (row.created_at as string) || '',
      updatedAt: (row.updated_at as string) || '',
      item: {
        id: '',
        title: row.item_title as string,
        type: row.item_type as FeedReview['item']['type'],
        externalId: null,
        posterUrl: (row.item_poster_url as string) || null,
        description: null,
        releaseYear: (row.item_release_year as number) || null,
        metadata: null,
        createdAt: '',
      },
      profile: {
        id: '',
        username: '',
        displayName: row.is_anonymous
          ? (row.reviewer_pseudonym as string) || 'Anonymous'
          : (row.reviewer_name as string) || 'Unknown',
        avatarUrl: null,
        phoneHash: null,
        email: '',
        createdAt: '',
        updatedAt: '',
      },
      depth: row.depth as number,
      isAnonymous: row.is_anonymous as boolean,
      displayName: row.is_anonymous
        ? (row.reviewer_pseudonym as string) || 'Anonymous'
        : (row.reviewer_name as string) || 'Unknown',
    }));

    // Apply pagination
    const from = (options.page - 1) * options.pageSize;
    const paginated = feedReviews.slice(from, from + options.pageSize);

    return {
      data: paginated,
      total: feedReviews.length,
      page: options.page,
      pageSize: options.pageSize,
      hasMore: feedReviews.length > from + paginated.length,
    };
  }

  async getNetworkReviews(
    userId: string,
    depth: number = 2,
    typeFilter?: string
  ): Promise<NetworkReview[]> {
    const { data, error } = await supabase.rpc('get_network_reviews', {
      p_user_id: userId,
      p_depth: depth,
      p_item_type: typeFilter || null,
    });

    if (error) throw new Error(error.message);

    return (data || []).map((row: Record<string, unknown>) => ({
      reviewId: row.review_id as string,
      reviewerName: (row.reviewer_name as string) || 'Unknown',
      reviewerPseudonym: (row.reviewer_pseudonym as string) || null,
      isAnonymous: row.is_anonymous as boolean,
      itemTitle: row.item_title as string,
      itemType: row.item_type as NetworkReview['itemType'],
      rating: row.rating as number,
      comment: (row.comment as string) || null,
      depth: row.depth as number,
    }));
  }

  // ---- Private Helpers ----

  private mapReview(row: Record<string, unknown>): Review {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      itemId: row.item_id as string,
      rating: row.rating as number,
      comment: (row.comment as string) || null,
      link: (row.link as string) || null,
      isPublic: row.is_public as boolean,
      sharingLevel: (row.sharing_level as number) ?? (row.is_public ? 4 : 1),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

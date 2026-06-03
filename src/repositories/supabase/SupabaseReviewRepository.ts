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
    // 1. Fetch network reviews
    const { data: networkData, error: networkError } = await supabase.rpc('get_network_reviews', {
      p_user_id: userId,
      p_depth: 2,
      p_item_type: options.typeFilter || null,
    });

    if (networkError) throw new Error(networkError.message);

    const feedReviews: FeedReview[] = (networkData || []).map((row: Record<string, unknown>) => ({
      id: row.review_id as string,
      userId: (row.reviewer_id as string) || '',
      itemId: (row.item_id as string) || '',
      rating: row.rating as number,
      comment: (row.comment as string) || null,
      link: null,
      isPublic: true,
      sharingLevel: (row.sharing_level as number) ?? 1,
      createdAt: (row.created_at as string) || '',
      updatedAt: (row.updated_at as string) || '',
      item: {
        id: (row.item_id as string) || '',
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
        id: (row.reviewer_id as string) || '',
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

    let finalReviews = feedReviews;

    // 2. Fetch global reviews if scope is 'global'
    if (options.scope === 'global') {
      let publicQuery = supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          item_id,
          rating,
          comment,
          link,
          is_public,
          sharing_level,
          created_at,
          updated_at,
          item:items!inner(id, title, type, external_id, poster_url, description, release_year, metadata, created_at),
          profile:profiles(*)
        `)
        .eq('sharing_level', 4);

      if (options.typeFilter) {
        publicQuery = publicQuery.eq('item.type', options.typeFilter);
      }

      const { data: publicData, error: publicError } = await publicQuery;
      if (publicError) throw new Error(publicError.message);

      const publicReviews: FeedReview[] = (publicData || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        itemId: row.item_id,
        rating: row.rating,
        comment: row.comment,
        link: row.link,
        isPublic: row.is_public,
        sharingLevel: row.sharing_level,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        item: {
          id: row.item.id,
          title: row.item.title,
          type: row.item.type,
          externalId: row.item.external_id,
          posterUrl: row.item.poster_url,
          description: row.item.description,
          releaseYear: row.item.release_year,
          metadata: row.item.metadata,
          createdAt: row.item.created_at,
        },
        profile: {
          id: row.profile?.id || '',
          username: row.profile?.username || '',
          displayName: row.profile?.display_name || 'Unknown',
          avatarUrl: row.profile?.avatar_url || null,
          phone: row.profile?.phone || null,
          email: row.profile?.email || '',
          friendTag: row.profile?.friend_tag || '',
          createdAt: row.profile?.created_at || '',
          updatedAt: row.profile?.updated_at || '',
        },
        depth: 3, // depth 3 represents public review outside network
        isAnonymous: false,
        displayName: row.profile?.display_name || 'Unknown',
      }));

      // Find all user IDs in the user's network to exclude them
      const networkUserIds = new Set<string>([
        userId,
        ...(networkData || []).map((row: any) => row.reviewer_id as string).filter(Boolean)
      ]);

      // Global feed should exclude any review authored by a user in the network
      finalReviews = publicReviews
        .filter((r) => !networkUserIds.has(r.userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply pagination
    const from = (options.page - 1) * options.pageSize;
    const paginated = finalReviews.slice(from, from + options.pageSize);

    return {
      data: paginated,
      total: finalReviews.length,
      page: options.page,
      pageSize: options.pageSize,
      hasMore: finalReviews.length > from + paginated.length,
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

  async getItemReviewsDetail(
    itemId: string,
    userId: string,
    scope: 'network' | 'global'
  ): Promise<FeedReview[]> {
    // 1. Fetch network reviews and filter by itemId
    const { data: networkData, error: networkError } = await supabase.rpc('get_network_reviews', {
      p_user_id: userId,
      p_depth: 2,
    });
    if (networkError) throw new Error(networkError.message);

    const networkItemReviews = (networkData || [])
      .filter((row: any) => row.item_id === itemId)
      .map((row: any) => ({
        id: row.review_id,
        userId: (row.reviewer_id as string) || '',
        itemId: row.item_id,
        rating: row.rating,
        comment: row.comment,
        link: null,
        isPublic: true,
        sharingLevel: row.sharing_level ?? 1,
        createdAt: row.created_at || '',
        updatedAt: row.updated_at || '',
        item: {
          id: row.item_id,
          title: row.item_title,
          type: row.item_type,
          externalId: null,
          posterUrl: row.item_poster_url,
          description: null,
          releaseYear: row.item_release_year,
          metadata: null,
          createdAt: '',
        },
        profile: {
          id: (row.reviewer_id as string) || '',
          username: '',
          displayName: row.is_anonymous
            ? (row.reviewer_pseudonym || 'Anonymous')
            : (row.reviewer_name || 'Unknown'),
          avatarUrl: null,
          phoneHash: null,
          email: '',
          createdAt: '',
          updatedAt: '',
        },
        depth: row.depth,
        isAnonymous: row.is_anonymous,
        displayName: row.is_anonymous
          ? (row.reviewer_pseudonym || 'Anonymous')
          : (row.reviewer_name || 'Unknown'),
      }));

    if (scope === 'network') {
      return networkItemReviews;
    }

    // 2. Fetch public reviews for this item
    const { data: publicData, error: publicError } = await supabase
      .from('reviews')
      .select(`
        id,
        user_id,
        item_id,
        rating,
        comment,
        link,
        is_public,
        sharing_level,
        created_at,
        updated_at,
        item:items(*),
        profile:profiles(*)
      `)
      .eq('item_id', itemId)
      .eq('sharing_level', 4);

    if (publicError) throw new Error(publicError.message);

    const publicItemReviews = (publicData || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      itemId: row.item_id,
      rating: row.rating,
      comment: row.comment,
      link: row.link,
      isPublic: row.is_public,
      sharingLevel: row.sharing_level,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      item: {
        id: row.item.id,
        title: row.item.title,
        type: row.item.type,
        externalId: row.item.external_id,
        posterUrl: row.item.poster_url,
        description: row.item.description,
        releaseYear: row.item.release_year,
        metadata: row.item.metadata,
        createdAt: row.item.created_at,
      },
      profile: {
        id: row.profile?.id || '',
        username: row.profile?.username || '',
        displayName: row.profile?.display_name || 'Unknown',
        avatarUrl: row.profile?.avatar_url || null,
        phone: row.profile?.phone || null,
        email: row.profile?.email || '',
        friendTag: row.profile?.friend_tag || '',
        createdAt: row.profile?.created_at || '',
        updatedAt: row.profile?.updated_at || '',
      },
      depth: 3,
      isAnonymous: false,
      displayName: row.profile?.display_name || 'Unknown',
    }));

    // Find all user IDs in the user's network to exclude them from global detail view
    const networkUserIds = new Set<string>([
      userId,
      ...(networkData || []).map((row: any) => row.reviewer_id as string).filter(Boolean)
    ]);

    // Filter global reviews to exclude any network users
    const filteredGlobalReviews = publicItemReviews.filter((r) => !networkUserIds.has(r.userId));

    return filteredGlobalReviews.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

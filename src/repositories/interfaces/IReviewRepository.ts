// ============================================================
// IReviewRepository — Review CRUD + feed operations contract
// ============================================================

import {
  Review,
  CreateReviewInput,
  PaginationOptions,
  PaginatedResult,
  FeedReview,
  FeedOptions,
  NetworkReview,
} from '../../types';

export interface IReviewRepository {
  /** Create a new review */
  create(userId: string, review: CreateReviewInput): Promise<Review>;

  /** Update an existing review */
  update(id: string, data: Partial<CreateReviewInput>): Promise<Review>;

  /** Delete a review */
  delete(id: string): Promise<void>;

  /** Get a single review by ID */
  getById(id: string): Promise<Review | null>;

  /** Get all reviews by a specific user */
  getByUserId(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Review>>;

  /** Get all reviews for a specific item */
  getByItemId(itemId: string, options?: PaginationOptions): Promise<PaginatedResult<Review>>;

  /**
   * Get the feed for a user — includes own reviews + friends + friends-of-friends.
   * Respects sharing permissions and anonymity.
   */
  getFeedReviews(userId: string, options?: FeedOptions): Promise<PaginatedResult<FeedReview>>;

  /**
   * Get network reviews traversing the social graph.
   * depth: how many hops (1 = friends, 2 = friends-of-friends)
   * Applies pseudonyms for anonymous sharing.
   */
  getNetworkReviews(
    userId: string,
    depth?: number,
    typeFilter?: string
  ): Promise<NetworkReview[]>;

  /**
   * Get all reviews for a specific item, filtered by scope (network vs global).
   */
  getItemReviewsDetail(
    itemId: string,
    userId: string,
    scope: 'network' | 'global'
  ): Promise<FeedReview[]>;
}

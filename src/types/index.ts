// ============================================================
// FriendLens — Domain Model Types
// ============================================================

// ---- Base Types ----

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FeedOptions extends PaginationOptions {
  typeFilter?: ItemType;
  depthFilter?: number; // 0 = own, 1 = friend, 2 = friend-of-friend
}

export interface SearchFilters {
  type?: ItemType;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'rating' | 'recent' | 'popular';
}

// ---- Enums ----

export type ItemType = 'movie' | 'series' | 'youtube' | 'video' | 'product' | 'restaurant';

export type ConnectionStatus = 'pending' | 'accepted' | 'blocked';

export type ShareLevel = 'own_only' | 'friends_included';

// ---- Core Models ----

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  phoneHash: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  title: string;
  type: ItemType;
  externalId: string | null; // TMDb ID, YouTube ID, etc.
  posterUrl: string | null;
  description: string | null;
  releaseYear: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  itemId: string;
  rating: number; // 1–10
  comment: string | null;
  link: string | null; // original URL pasted by user
  isPublic: boolean;
  sharingLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SharingPermission {
  id: string;
  ownerId: string;
  viewerId: string;
  shareLevel: ShareLevel;
  anonymousFriends: boolean; // hide friend names behind pseudonyms
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  comment: string;
  createdAt: string;
}

// ---- Composite / View Types ----

export interface ReviewWithDetails extends Review {
  item: Item;
  profile: Profile;
}

export interface FeedReview extends ReviewWithDetails {
  depth: number; // 0 = own, 1 = friend, 2 = friend-of-friend
  isAnonymous: boolean;
  displayName: string; // real name or pseudonym
}

export interface NetworkReview {
  reviewId: string;
  reviewerName: string; // real name for direct friends
  reviewerPseudonym: string | null; // random pseudonym for friends-of-friends
  isAnonymous: boolean;
  itemTitle: string;
  itemType: ItemType;
  rating: number;
  comment: string | null;
  depth: number;
}

export interface NetworkNode {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  pseudonym: string | null;
  reviewCount: number;
  depth: number;
}

export interface NetworkEdge {
  sourceId: string;
  targetId: string;
  depth: number;
}

export interface SearchResult {
  item: Item;
  networkReviewCount: number;
  averageRating: number | null;
}

export interface NetworkSearchResult extends SearchResult {
  reviews: NetworkReview[];
}

// ---- Auth Types ----

export interface AuthResult {
  user: Profile | null;
  session: AuthSession | null;
  error: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ---- Input Types ----

export interface CreateReviewInput {
  itemId: string;
  rating: number;
  comment?: string;
  link?: string;
  isPublic?: boolean;
  sharingLevel?: number;
}

export interface CreateItemInput {
  title: string;
  type: ItemType;
  externalId?: string;
  posterUrl?: string;
  description?: string;
  releaseYear?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateSharingPermissionInput {
  ownerId: string;
  viewerId: string;
  shareLevel: ShareLevel;
  anonymousFriends: boolean;
}

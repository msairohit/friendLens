// ============================================================
// Repository Factory — Single point of configuration
// ============================================================
// To swap backends, change ONLY this file.
// All stores and hooks import from here, never from Supabase directly.
// ============================================================

import { IAuthRepository } from './interfaces/IAuthRepository';
import { IReviewRepository } from './interfaces/IReviewRepository';
import { IItemRepository } from './interfaces/IItemRepository';
import { IConnectionRepository } from './interfaces/IConnectionRepository';
import { ISearchRepository } from './interfaces/ISearchRepository';
import { ISharingRepository } from './interfaces/ISharingRepository';
import { INotificationRepository } from './interfaces/INotificationRepository';

import { SupabaseAuthRepository } from './supabase/SupabaseAuthRepository';
import { SupabaseReviewRepository } from './supabase/SupabaseReviewRepository';
import { SupabaseItemRepository } from './supabase/SupabaseItemRepository';
import { SupabaseConnectionRepository } from './supabase/SupabaseConnectionRepository';
import { SupabaseSearchRepository } from './supabase/SupabaseSearchRepository';
import { SupabaseSharingRepository } from './supabase/SupabaseSharingRepository';
import { SupabaseNotificationRepository } from './supabase/SupabaseNotificationRepository';

export interface Repositories {
  auth: IAuthRepository;
  reviews: IReviewRepository;
  items: IItemRepository;
  connections: IConnectionRepository;
  search: ISearchRepository;
  sharing: ISharingRepository;
  notifications: INotificationRepository;
}

// ---- Current Implementation: Supabase ----
// To switch to a different backend:
//   1. Create new implementation classes (e.g., ElasticsearchSearchRepository)
//   2. Import them here
//   3. Replace the corresponding line below
//
// Example future swap for search:
//   search: new ElasticsearchSearchRepository(esClient),
//
// Example full backend swap:
//   auth: new CustomApiAuthRepository(apiClient),
//   reviews: new CustomApiReviewRepository(apiClient),
//   ... etc

export const repositories: Repositories = {
  auth: new SupabaseAuthRepository(),
  reviews: new SupabaseReviewRepository(),
  items: new SupabaseItemRepository(),
  connections: new SupabaseConnectionRepository(),
  search: new SupabaseSearchRepository(),
  sharing: new SupabaseSharingRepository(),
  notifications: new SupabaseNotificationRepository(),
};

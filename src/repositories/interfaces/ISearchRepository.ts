// ============================================================
// ISearchRepository — Search contract
// Designed for future Elasticsearch / reverse-index swap
// ============================================================

import { SearchFilters, SearchResult, NetworkSearchResult } from '../../types';

export interface ISearchRepository {
  /**
   * Search items by query string with optional filters.
   * Currently backed by Supabase full-text search.
   * Can be swapped to Elasticsearch for better relevance + reverse indexing.
   */
  searchItems(query: string, filters?: SearchFilters): Promise<SearchResult[]>;

  /**
   * Search across a user's entire network for reviews matching the query.
   * Respects sharing permissions and anonymity.
   */
  searchNetworkReviews(
    userId: string,
    query: string,
    filters?: SearchFilters
  ): Promise<NetworkSearchResult[]>;

  /** Get auto-complete suggestions as the user types */
  getSuggestions(query: string): Promise<string[]>;
}

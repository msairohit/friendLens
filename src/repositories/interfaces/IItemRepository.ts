// ============================================================
// IItemRepository — Item lookup and creation contract
// ============================================================

import { Item, CreateItemInput } from '../../types';

export interface IItemRepository {
  /** Find an existing item or create it if it doesn't exist */
  findOrCreate(item: CreateItemInput): Promise<Item>;

  /** Get an item by its ID */
  getById(id: string): Promise<Item | null>;

  /** Get an item by its external ID (e.g. TMDb ID) */
  getByExternalId(externalId: string): Promise<Item | null>;

  /** Search items by title (local DB search) */
  searchByTitle(query: string, type?: string): Promise<Item[]>;
}

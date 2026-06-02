// ============================================================
// ISharingRepository — Sharing permissions contract
// ============================================================

import { SharingPermission, CreateSharingPermissionInput } from '../../types';

export interface ISharingRepository {
  /** Get the sharing permission between an owner and a viewer */
  getPermission(
    ownerId: string,
    viewerId: string
  ): Promise<SharingPermission | null>;

  /** Set or update a sharing permission */
  setPermission(
    permission: CreateSharingPermissionInput
  ): Promise<SharingPermission>;

  /** Get all sharing permissions granted by a user */
  getPermissionsForUser(ownerId: string): Promise<SharingPermission[]>;

  /** Delete a sharing permission */
  deletePermission(ownerId: string, viewerId: string): Promise<void>;
}

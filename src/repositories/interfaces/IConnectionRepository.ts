// ============================================================
// IConnectionRepository — Friends / connections contract
// ============================================================

import { Connection, Profile } from '../../types';

export interface IConnectionRepository {
  /** Send a friend request */
  sendRequest(requesterId: string, addresseeId: string): Promise<Connection>;

  /** Accept a pending friend request */
  acceptRequest(connectionId: string): Promise<Connection>;

  /** Reject a pending friend request */
  rejectRequest(connectionId: string): Promise<void>;

  /** Block a user */
  blockUser(userId: string, blockedId: string): Promise<void>;

  /** Remove an existing connection (unfriend) */
  removeConnection(connectionId: string): Promise<void>;

  /** Get all accepted friends for a user */
  getFriends(userId: string): Promise<Profile[]>;

  /** Get pending friend requests received by a user */
  getPendingRequests(userId: string): Promise<Connection[]>;

  /** Get sent friend requests that are still pending */
  getSentRequests(userId: string): Promise<Connection[]>;

  /** Find registered users from a list of hashed phone numbers (contact discovery) */
  findUsersFromContacts(phoneHashes: string[]): Promise<Profile[]>;

  /** Get the connection between two users, if any */
  getConnectionBetween(
    userIdA: string,
    userIdB: string
  ): Promise<Connection | null>;
}

import { supabase } from '../../lib/supabase';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { NotificationWithSender, Profile } from '../../types';

export class SupabaseNotificationRepository implements INotificationRepository {
  async getNotifications(userId: string): Promise<NotificationWithSender[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      senderId: row.sender_id,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at,
      sender: this.mapProfile(row.sender),
    }));
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  }

  async createNotification(
    userId: string,
    senderId: string,
    type: 'friend_request' | 'request_accepted' | 'request_rejected'
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        sender_id: senderId,
        type: type,
        is_read: false,
      });

    if (error) throw new Error(error.message);
  }

  private mapProfile(row: Record<string, any>): Profile {
    return {
      id: row.id as string,
      username: row.username as string,
      displayName: (row.display_name as string) || '',
      avatarUrl: (row.avatar_url as string) || null,
      phone: (row.phone as string) || null,
      email: (row.email as string) || '',
      friendTag: (row.friend_tag as string) || '',
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

import { NotificationWithSender } from '../../types';

export interface INotificationRepository {
  /** Get all notifications for a user, ordered by newest first */
  getNotifications(userId: string): Promise<NotificationWithSender[]>;

  /** Mark a notification as read */
  markAsRead(notificationId: string): Promise<void>;

  /** Mark all notifications as read for a user */
  markAllAsRead(userId: string): Promise<void>;

  /** Delete a notification */
  deleteNotification(notificationId: string): Promise<void>;

  /** Send a new notification */
  createNotification(
    userId: string,
    senderId: string,
    type: 'friend_request' | 'request_accepted' | 'request_rejected'
  ): Promise<void>;
}

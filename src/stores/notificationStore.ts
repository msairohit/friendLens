import { create } from 'zustand';
import { repositories } from '../repositories';
import { NotificationWithSender } from '../types';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationState {
  notifications: NotificationWithSender[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  setupRealtimeSubscription: (userId: string) => () => void;
  requestPermissions: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  let subscriptionChannel: any = null;

  return {
    notifications: [],
    unreadCount: 0,
    loading: false,
    initialized: false,

    fetchNotifications: async (userId: string) => {
      set({ loading: true });
      try {
        const list = await repositories.notifications.getNotifications(userId);
        const unread = list.filter((n) => !n.isRead).length;
        set({ notifications: list, unreadCount: unread, initialized: true });
      } catch (e) {
        console.error('Error fetching notifications:', e);
      } finally {
        set({ loading: false });
      }
    },

    markAsRead: async (notificationId: string) => {
      try {
        await repositories.notifications.markAsRead(notificationId);
        set((state) => {
          const list = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          return {
            notifications: list,
            unreadCount: list.filter((n) => !n.isRead).length,
          };
        });
      } catch (e) {
        console.error('Error marking notification as read:', e);
      }
    },

    markAllAsRead: async (userId: string) => {
      try {
        await repositories.notifications.markAllAsRead(userId);
        set((state) => {
          const list = state.notifications.map((n) => ({ ...n, isRead: true }));
          return {
            notifications: list,
            unreadCount: 0,
          };
        });
      } catch (e) {
        console.error('Error marking all notifications as read:', e);
      }
    },

    deleteNotification: async (notificationId: string) => {
      try {
        await repositories.notifications.deleteNotification(notificationId);
        set((state) => {
          const list = state.notifications.filter((n) => n.id !== notificationId);
          return {
            notifications: list,
            unreadCount: list.filter((n) => !n.isRead).length,
          };
        });
      } catch (e) {
        console.error('Error deleting notification:', e);
      }
    },

    requestPermissions: async () => {
      if (Platform.OS === 'web') return;
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('Notification permissions not granted!');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch (err) {
        console.error('Error requesting notification permissions:', err);
      }
    },

    setupRealtimeSubscription: (userId: string) => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }

      // Request permission
      get().requestPermissions();

      subscriptionChannel = supabase
        .channel(`notifications:user_id=eq.${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const newNotif = payload.new;
            
            // Re-fetch notifications list to get sender details
            await get().fetchNotifications(userId);

            const fetchedNotif = get().notifications.find((n) => n.id === newNotif.id);
            const senderName = fetchedNotif?.sender?.displayName || fetchedNotif?.sender?.username || 'Someone';

            let title = 'New Notification';
            let body = '';

            if (newNotif.type === 'friend_request') {
              title = 'Friend Request';
              body = `${senderName} sent you a friend request.`;
            } else if (newNotif.type === 'request_accepted') {
              title = 'Friend Request Accepted';
              body = `${senderName} accepted your friend request.`;
            } else if (newNotif.type === 'request_rejected') {
              title = 'Friend Request Ignored';
              body = `${senderName} ignored your friend request.`;
            }

            if (body) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body,
                  data: { type: newNotif.type },
                },
                trigger: null,
              });
            }
          }
        )
        .subscribe();

      return () => {
        if (subscriptionChannel) {
          subscriptionChannel.unsubscribe();
          subscriptionChannel = null;
        }
      };
    },
  };
});

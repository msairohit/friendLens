import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useStyles } from '../src/stores/themeStore';
import { Typography } from '../src/constants/typography';
import { Spacing, BorderRadius } from '../src/constants/layout';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Avatar } from '../src/components/ui/Avatar';
import { useAuthStore } from '../src/stores/authStore';
import { useNotificationStore } from '../src/stores/notificationStore';
import { NotificationWithSender } from '../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const router = useRouter();
  
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user]);

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: c.glassBorder,
      },
      headerTitle: {
        color: c.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
      },
      markAllText: {
        color: c.accentStart,
        fontSize: 13,
        fontWeight: '600',
      },
      listContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      card: {
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
      },
      unreadCard: {
        borderColor: c.accentStart,
        borderWidth: 1,
      },
      unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: c.accentStart,
        marginRight: Spacing.xs,
      },
      info: {
        flex: 1,
        marginLeft: Spacing.md,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
      },
      senderName: {
        color: c.textPrimary,
        fontWeight: '600',
      },
      text: {
        color: c.textSecondary,
      },
      time: {
        color: c.textMuted,
        fontSize: 11,
        marginTop: 4,
      },
      deleteBtn: {
        padding: Spacing.xs,
      },
      emptyCard: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xl,
      },
      emptyText: {
        color: c.textMuted,
        textAlign: 'center',
        marginTop: Spacing.sm,
        fontSize: 14,
      },
    })
  );

  const handleNotificationPress = async (item: NotificationWithSender) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    
    // Navigate appropriately
    if (item.type === 'friend_request') {
      router.push('/friends');
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'friend_request':
        return ' sent you a friend request.';
      case 'request_accepted':
        return ' accepted your friend request!';
      case 'request_rejected':
        return ' ignored your friend request.';
      default:
        return ' interacted with you.';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return { name: 'person-add', color: colors.accentStart };
      case 'request_accepted':
        return { name: 'checkmark-circle', color: colors.success };
      case 'request_rejected':
        return { name: 'close-circle', color: colors.error };
      default:
        return { name: 'notifications', color: colors.textSecondary };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accentStart} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={() => user && markAllAsRead(user.id)}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const icon = getNotificationIcon(item.type);
          return (
            <Pressable onPress={() => handleNotificationPress(item)}>
              <GlassCard style={[styles.card, !item.isRead && styles.unreadCard]}>
                {!item.isRead && <View style={styles.unreadDot} />}
                <Avatar
                  name={item.sender.displayName || item.sender.username}
                  uri={item.sender.avatarUrl}
                  size="md"
                />
                <View style={styles.info}>
                  <View style={styles.row}>
                    <Text style={styles.senderName}>
                      {item.sender.displayName || item.sender.username}
                    </Text>
                    <Text style={styles.text}>{getNotificationText(item.type)}</Text>
                  </View>
                  <Text style={styles.time}>
                    <Ionicons name={icon.name as any} size={11} color={icon.color} />
                    {'  '}
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteNotification(item.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </GlassCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>You have no notifications yet.</Text>
          </GlassCard>
        }
      />
    </SafeAreaView>
  );
}

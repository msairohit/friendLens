import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Avatar } from '../../src/components/ui/Avatar';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { Connection, Profile } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ConnectionRequest {
  connection: Connection;
  profile: Profile;
}

export default function FriendsListScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const router = useRouter();

  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      listContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      sectionTitle: {
        color: c.textMuted,
        letterSpacing: 1.5,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
      },
      card: {
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
      },
      info: {
        flex: 1,
        marginLeft: Spacing.md,
      },
      name: {
        color: c.textPrimary,
        fontSize: 16,
        fontWeight: '600',
      },
      username: {
        color: c.textSecondary,
        fontSize: 13,
      },
      tag: {
        color: c.textMuted,
        fontSize: 11,
        marginTop: 1,
      },
      actions: {
        flexDirection: 'row',
        gap: Spacing.xs,
      },
      actionSpinner: {
        marginLeft: Spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
      },
      emptyCard: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: Spacing.sm,
      },
      emptyText: {
        color: c.textMuted,
        textAlign: 'center',
        marginTop: Spacing.sm,
        fontSize: 14,
      },
      quickActionsCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
      },
      quickActionsTitle: {
        color: c.textPrimary,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: Spacing.sm,
      },
      quickActionsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
      },
      actionBtn: {
        flex: 1,
      },
      badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      badge: {
        backgroundColor: c.accentStart,
        borderRadius: BorderRadius.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: Spacing.sm,
      },
      badgeText: {
        color: c.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
      },
    })
  );

  const fetchConnections = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);

    try {
      // 1. Get friends
      const friendsList = await repositories.connections.getFriends(user.id);
      setFriends(friendsList);

      // 2. Get pending requests
      const pending = await repositories.connections.getPendingRequests(user.id);
      const resolvedRequests = pending.map((conn) => ({
        connection: conn,
        profile: conn.requester,
      }));
      setIncomingRequests(resolvedRequests);
    } catch (e) {
      console.error('Error fetching friends data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConnections(false);
  }, [fetchConnections]);

  const handleAcceptRequest = async (connectionId: string) => {
    setActionLoadingId(connectionId);
    try {
      await repositories.connections.acceptRequest(connectionId);
      Alert.alert('Success', 'Friend request accepted!');
      fetchConnections(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept friend request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    setActionLoadingId(connectionId);
    try {
      await repositories.connections.rejectRequest(connectionId);
      Alert.alert('Success', 'Friend request ignored');
      fetchConnections(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reject friend request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnfriend = (profile: Profile) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${profile.displayName || profile.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setLoading(true);
            try {
              const conn = await repositories.connections.getConnectionBetween(user.id, profile.id);
              if (conn) {
                await repositories.connections.removeConnection(conn.id);
                fetchConnections(false);
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to remove friend');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accentStart} />
      </View>
    );
  }

  // Combine lists into sections for FlatList
  const data = [
    { type: 'header' },
    { type: 'requests_title' },
    ...incomingRequests.map(r => ({ type: 'request', ...r })),
    ...(incomingRequests.length === 0 ? [{ type: 'empty_requests' }] : []),
    { type: 'friends_title' },
    ...friends.map(f => ({ type: 'friend', profile: f })),
    ...(friends.length === 0 ? [{ type: 'empty_friends' }] : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentStart}
            colors={[colors.accentStart]}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <GlassCard style={styles.quickActionsCard}>
                <Text style={styles.quickActionsTitle}>Find & Add Friends</Text>
                <View style={styles.quickActionsRow}>
                  <GradientButton
                    title="Add by Tag"
                    onPress={() => router.push('/friends/add-friend')}
                    size="sm"
                    style={styles.actionBtn}
                    icon={<Ionicons name="search-outline" size={14} color={colors.textPrimary} />}
                  />
                  <GradientButton
                    title="Scan Contacts"
                    onPress={() => router.push('/friends/discover')}
                    size="sm"
                    variant="accent"
                    style={styles.actionBtn}
                    icon={<Ionicons name="scan-outline" size={14} color={colors.textPrimary} />}
                  />
                </View>
              </GlassCard>
            );
          }

          if (item.type === 'requests_title') {
            return (
              <View style={styles.badgeContainer}>
                <Text style={[Typography.caption, styles.sectionTitle]}>PENDING REQUESTS</Text>
                {incomingRequests.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{incomingRequests.length}</Text>
                  </View>
                )}
              </View>
            );
          }

          if (item.type === 'empty_requests') {
            return (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="mail-open-outline" size={32} color={colors.textMuted} />
                <Text style={[Typography.body, styles.emptyText]}>No pending friend requests.</Text>
              </GlassCard>
            );
          }

          if (item.type === 'requests_title') {
            return <Text style={[Typography.caption, styles.sectionTitle]}>PENDING REQUESTS</Text>;
          }

          if (item.type === 'friends_title') {
            return <Text style={[Typography.caption, styles.sectionTitle]}>MY FRIENDS ({friends.length})</Text>;
          }

          if (item.type === 'empty_friends') {
            return (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                <Text style={[Typography.body, styles.emptyText]}>You haven't added any friends yet.</Text>
              </GlassCard>
            );
          }

          if (item.type === 'request' && 'connection' in item && 'profile' in item) {
            const req = item as { connection: Connection; profile: Profile };
            const isButtonLoading = actionLoadingId === req.connection.id;
            return (
              <GlassCard style={styles.card}>
                <Avatar name={req.profile.displayName || req.profile.username} uri={req.profile.avatarUrl} size="md" />
                <View style={styles.info}>
                  <Text style={[Typography.bodyBold, styles.name]}>{req.profile.displayName || req.profile.username}</Text>
                  <Text style={styles.username}>@{req.profile.username}</Text>
                  <Text style={styles.tag}>{req.profile.friendTag}</Text>
                </View>
                {isButtonLoading ? (
                  <View style={styles.actionSpinner}>
                    <ActivityIndicator size="small" color={colors.accentStart} />
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <GradientButton
                      title="Accept"
                      onPress={() => handleAcceptRequest(req.connection.id)}
                      size="sm"
                    />
                    <GradientButton
                      title="Ignore"
                      onPress={() => handleRejectRequest(req.connection.id)}
                      size="sm"
                      variant="outline"
                    />
                  </View>
                )}
              </GlassCard>
            );
          }

          if (item.type === 'friend' && 'profile' in item) {
            const friend = item.profile as Profile;
            return (
              <GlassCard style={styles.card}>
                <Avatar name={friend.displayName || friend.username} uri={friend.avatarUrl} size="md" />
                <View style={styles.info}>
                  <Text style={[Typography.bodyBold, styles.name]}>{friend.displayName || friend.username}</Text>
                  <Text style={styles.username}>@{friend.username}</Text>
                  <Text style={styles.tag}>{friend.friendTag}</Text>
                </View>
                <GradientButton
                  title="Remove"
                  onPress={() => handleUnfriend(friend)}
                  size="sm"
                  variant="outline"
                />
              </GlassCard>
            );
          }

          return null;
        }}
      />
    </SafeAreaView>
  );
}

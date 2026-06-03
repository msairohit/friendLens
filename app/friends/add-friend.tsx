import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { Avatar } from '../../src/components/ui/Avatar';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { Profile, Connection } from '../../src/types';

interface UserResult {
  profile: Profile;
  connection: Connection | null;
  actionLoading: boolean;
}

export default function AddFriendScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      tagCard: {
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      tagLeft: {
        flex: 1,
      },
      tagLabel: {
        color: c.textSecondary,
        fontSize: 11,
        marginBottom: 2,
      },
      tagValue: {
        color: c.accentStart,
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
      },
      copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
      },
      copyText: {
        color: c.textSecondary,
        fontSize: 12,
        fontWeight: '600',
      },
      searchHint: {
        color: c.textMuted,
        fontSize: 12,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
        textAlign: 'center',
        fontStyle: 'italic',
      },
      resultCard: {
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
      },
      resultInfo: {
        flex: 1,
        marginLeft: Spacing.md,
      },
      resultName: {
        color: c.textPrimary,
        fontSize: 16,
        fontWeight: '600',
      },
      resultUsername: {
        color: c.textSecondary,
        fontSize: 13,
      },
      resultTag: {
        color: c.textMuted,
        fontSize: 11,
        marginTop: 1,
      },
      actionContainer: {
        marginLeft: Spacing.sm,
      },
      statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
      },
      requestedBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: c.textMuted,
      },
      friendsBadge: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        borderWidth: 1,
        borderColor: c.success,
      },
      requestedText: {
        color: c.textMuted,
        fontSize: 12,
        fontWeight: '600',
      },
      friendsText: {
        color: c.success,
        fontSize: 12,
        fontWeight: '600',
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
      },
      emptyIcon: {
        marginBottom: Spacing.md,
        opacity: 0.3,
      },
      emptyText: {
        color: c.textMuted,
        textAlign: 'center',
        fontSize: 14,
      },
      loadingContainer: {
        alignItems: 'center',
        paddingVertical: Spacing['2xl'],
      },
    })
  );

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!user || !searchQuery.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        let profiles: Profile[] = [];

        if (searchQuery.includes('#')) {
          // Exact friend tag search
          const profile = await repositories.connections.searchByFriendTag(searchQuery.trim());
          if (profile && profile.id !== user.id) {
            profiles = [profile];
          }
        } else {
          // Username prefix search
          profiles = await repositories.connections.searchUsersByUsername(
            searchQuery.trim(),
            user.id
          );
        }

        // Fetch connection status for each result
        const resultsWithStatus: UserResult[] = await Promise.all(
          profiles.map(async (profile) => {
            const connection = await repositories.connections.getConnectionBetween(
              user.id,
              profile.id
            );
            return { profile, connection, actionLoading: false };
          })
        );

        setResults(resultsWithStatus);
      } catch (e) {
        console.error('Search error:', e);
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [user]
  );

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (!text.trim()) {
        setResults([]);
        return;
      }

      debounceTimer.current = setTimeout(() => {
        handleSearch(text);
      }, 300);
    },
    [handleSearch]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleCopyTag = async () => {
    if (user?.friendTag) {
      await Clipboard.setStringAsync(user.friendTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendRequest = async (index: number) => {
    if (!user) return;
    const result = results[index];

    // Set loading for this specific result
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, actionLoading: true } : r))
    );

    try {
      const connection = await repositories.connections.sendRequest(
        user.id,
        result.profile.id
      );
      // Update the result with the new connection
      setResults((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, connection, actionLoading: false } : r
        )
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send request');
      setResults((prev) =>
        prev.map((r, i) => (i === index ? { ...r, actionLoading: false } : r))
      );
    }
  };

  const handleAcceptRequest = async (index: number) => {
    const result = results[index];
    if (!result.connection) return;

    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, actionLoading: true } : r))
    );

    try {
      const updated = await repositories.connections.acceptRequest(result.connection.id);
      setResults((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, connection: updated, actionLoading: false } : r
        )
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept request');
      setResults((prev) =>
        prev.map((r, i) => (i === index ? { ...r, actionLoading: false } : r))
      );
    }
  };

  const renderAction = (result: UserResult, index: number) => {
    if (result.actionLoading) {
      return (
        <View style={styles.actionContainer}>
          <ActivityIndicator size="small" color={colors.accentStart} />
        </View>
      );
    }

    const { connection } = result;

    if (!connection) {
      // No connection — show Add button
      return (
        <View style={styles.actionContainer}>
          <GradientButton
            title="Add"
            onPress={() => handleSendRequest(index)}
            size="sm"
            icon={<Ionicons name="person-add-outline" size={14} color={colors.textPrimary} />}
          />
        </View>
      );
    }

    if (connection.status === 'accepted') {
      return (
        <View style={styles.actionContainer}>
          <View style={[styles.statusBadge, styles.friendsBadge]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.friendsText}>Friends</Text>
          </View>
        </View>
      );
    }

    if (connection.status === 'pending') {
      if (user && connection.requesterId === user.id) {
        // I sent this request
        return (
          <View style={styles.actionContainer}>
            <View style={[styles.statusBadge, styles.requestedBadge]}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.requestedText}>Requested</Text>
            </View>
          </View>
        );
      } else {
        // They sent me a request — show Accept
        return (
          <View style={styles.actionContainer}>
            <GradientButton
              title="Accept"
              onPress={() => handleAcceptRequest(index)}
              size="sm"
              variant="accent"
              icon={<Ionicons name="checkmark" size={14} color={colors.textPrimary} />}
            />
          </View>
        );
      }
    }

    return null;
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* My Friend Tag */}
        <GlassCard style={styles.tagCard}>
          <View style={styles.tagLeft}>
            <Text style={[Typography.caption, styles.tagLabel]}>YOUR FRIEND TAG</Text>
            <Text style={styles.tagValue}>{user.friendTag}</Text>
          </View>
          <Pressable onPress={handleCopyTag} style={styles.copyButton}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={copied ? colors.success : colors.textSecondary}
            />
            <Text style={[styles.copyText, copied && { color: colors.success }]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </Pressable>
        </GlassCard>

        {/* Search Bar */}
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search by tag (john#4829) or username..."
          onSubmit={() => handleSearch(query)}
        />

        <Text style={styles.searchHint}>
          Enter an exact friend tag (with #) for a precise match, or type a username to browse
        </Text>

        {/* Results */}
        {searching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accentStart} />
          </View>
        ) : results.length > 0 ? (
          results.map((result, index) => (
            <GlassCard key={result.profile.id} style={styles.resultCard}>
              <Avatar
                name={result.profile.displayName || result.profile.username}
                uri={result.profile.avatarUrl}
                size="md"
              />
              <View style={styles.resultInfo}>
                <Text style={[Typography.bodyBold, styles.resultName]}>
                  {result.profile.displayName || result.profile.username}
                </Text>
                <Text style={styles.resultUsername}>@{result.profile.username}</Text>
                <Text style={styles.resultTag}>{result.profile.friendTag}</Text>
              </View>
              {renderAction(result, index)}
            </GlassCard>
          ))
        ) : query.trim().length > 0 && !searching ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={48}
              color={colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={[Typography.body, styles.emptyText]}>
              No users found. Try a different username or friend tag.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

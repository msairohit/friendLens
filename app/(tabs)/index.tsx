import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Spacing } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { ReviewCard } from '../../src/components/reviews/ReviewCard';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';
import { EmptyState } from '../../src/components/common/EmptyState';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { FeedReview } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeFeedScreen() {
  const { user } = useAuthStore();
  const [scope, setScope] = useState<'network' | 'global'>('network');
  const [reviews, setReviews] = useState<FeedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      listContainer: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      toggleContainer: {
        flexDirection: 'row',
        backgroundColor: c.surface,
        borderRadius: 24,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
        padding: 4,
        borderWidth: 1,
        borderColor: c.divider,
      },
      toggleButton: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
      },
      activeGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 20,
      },
      toggleText: {
        fontSize: 14,
        fontWeight: '600',
        zIndex: 1,
      },
    })
  );

  const fetchFeed = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await repositories.reviews.getFeedReviews(user.id, {
        page: 1,
        pageSize: 50,
        scope,
      });
      setReviews(result.data);
    } catch (e: any) {
      console.error('Error fetching feed:', e);
      setError(e.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, scope]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed(false);
  }, [fetchFeed]);

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading feed..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Something went wrong"
          subtitle={error}
          icon="alert-circle-outline"
          action={
            <GradientButton
              title="Try Again"
              onPress={() => fetchFeed()}
              size="sm"
            />
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Scope Toggle Control */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={styles.toggleButton}
          activeOpacity={0.8}
          onPress={() => setScope('network')}
        >
          {scope === 'network' && (
            <LinearGradient
              colors={[colors.accentStart, colors.accentEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeGradient}
            />
          )}
          <Text
            style={[
              styles.toggleText,
              { color: scope === 'network' ? '#FFF' : colors.textSecondary },
            ]}
          >
            My Network
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          activeOpacity={0.8}
          onPress={() => setScope('global')}
        >
          {scope === 'global' && (
            <LinearGradient
              colors={[colors.accentStart, colors.accentEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeGradient}
            />
          )}
          <Text
            style={[
              styles.toggleText,
              { color: scope === 'global' ? '#FFF' : colors.textSecondary },
            ]}
          >
            Global
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentStart}
            colors={[colors.accentStart]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={scope === 'network' ? 'Your network is silent' : 'No global reviews yet'}
            subtitle={
              scope === 'network'
                ? 'Add reviews or connect with friends to see recommendations here.'
                : 'Be the first one to share a public review!'
            }
            icon="chatbubbles-outline"
          />
        }
      />
    </SafeAreaView>
  );
}

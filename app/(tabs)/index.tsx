import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl, SafeAreaView } from 'react-native';
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

export default function HomeFeedScreen() {
  const { user } = useAuthStore();
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
      });
      setReviews(result.data);
    } catch (e: any) {
      console.error('Error fetching feed:', e);
      setError(e.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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
            title="Your feed is empty"
            subtitle="Add reviews or connect with friends to see recommendations here."
            icon="chatbubbles-outline"
          />
        }
      />
    </SafeAreaView>
  );
}

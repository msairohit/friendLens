import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ReviewCard } from '../../src/components/reviews/ReviewCard';
import { repositories } from '../../src/repositories';
import { useAuthStore } from '../../src/stores/authStore';
import { Item, FeedReview } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StarRating } from '../../src/components/ui/StarRating';
import { getTMDbDetails } from '../../src/lib/tmdb';

const { width } = Dimensions.get('window');

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();

  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<FeedReview[]>([]);
  const [scope, setScope] = useState<'network' | 'global'>('network');
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    networkAvg: 0,
    networkCount: 0,
    globalAvg: 0,
    globalCount: 0,
  });

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
      },
      backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.divider,
      },
      headerTitle: {
        color: c.textPrimary,
        flex: 1,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        color: c.textSecondary,
        marginTop: Spacing.sm,
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
      },
      errorText: {
        color: c.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
      },
      retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: c.accentStart,
      },
      retryText: {
        color: '#FFF',
        fontWeight: 'bold',
      },
      itemDetailsCard: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.xs,
        padding: Spacing.md,
      },
      itemRow: {
        flexDirection: 'row',
        gap: Spacing.md,
      },
      poster: {
        width: 100,
        height: 150,
        borderRadius: BorderRadius.md,
        backgroundColor: c.surfaceElevated,
      },
      posterPlaceholder: {
        width: 100,
        height: 150,
        borderRadius: BorderRadius.md,
        backgroundColor: c.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
      },
      itemInfo: {
        flex: 1,
        justifyContent: 'space-between',
      },
      title: {
        color: c.textPrimary,
        marginBottom: 4,
      },
      meta: {
        color: c.textMuted,
        marginBottom: Spacing.xs,
      },
      description: {
        color: c.textSecondary,
        lineHeight: 18,
      },
      statsRow: {
        flexDirection: 'row',
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        gap: Spacing.md,
      },
      statCard: {
        flex: 1,
        padding: Spacing.sm,
        alignItems: 'center',
        gap: 4,
      },
      statLabel: {
        color: c.textMuted,
        fontSize: 12,
        fontWeight: '600',
      },
      statVal: {
        color: c.textPrimary,
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 2,
      },
      statSub: {
        color: c.textMuted,
        fontSize: 10,
      },
      toggleContainer: {
        flexDirection: 'row',
        backgroundColor: c.surface,
        borderRadius: 24,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
        padding: 4,
        borderWidth: 1,
        borderColor: c.divider,
      },
      toggleButton: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 8,
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
        fontSize: 13,
        fontWeight: '600',
        zIndex: 1,
      },
      sectionTitle: {
        color: c.textPrimary,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
      },
      listContainer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      emptyTextContainer: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
      },
      emptyText: {
        color: c.textMuted,
        textAlign: 'center',
      },
    })
  );

  const fetchDetails = useCallback(async (force = false) => {
    if (!id || !user) return;
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      // 1. Fetch item
      const itemData = await repositories.items.getById(id as string);
      if (!itemData) {
        setError('Item not found');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setItem(itemData);

      // 1.5 Fetch TMDb rating if available
      if (itemData.externalId && itemData.externalId.startsWith('tmdb:')) {
        try {
          const tmdbData = await getTMDbDetails(itemData.externalId, force);
          if (tmdbData && tmdbData.rating !== undefined) {
            setTmdbRating(tmdbData.rating);
          }
        } catch (tmdbErr) {
          console.warn('Failed to fetch TMDb details:', tmdbErr);
        }
      }

      // 2. Fetch all reviews to compute stats (both network and global)
      const networkReviews = await repositories.reviews.getItemReviewsDetail(
        id as string,
        user.id,
        'network'
      );
      const globalReviews = await repositories.reviews.getItemReviewsDetail(
        id as string,
        user.id,
        'global'
      );

      // Compute statistics
      const netCount = networkReviews.length;
      const netAvg =
        netCount > 0
          ? networkReviews.reduce((sum, r) => sum + r.rating, 0) / netCount
          : 0;

      const globCount = globalReviews.length;
      const globAvg =
        globCount > 0
          ? globalReviews.reduce((sum, r) => sum + r.rating, 0) / globCount
          : 0;

      setStats({
        networkAvg: netAvg,
        networkCount: netCount,
        globalAvg: globAvg,
        globalCount: globCount,
      });

      // Set active reviews based on current scope selection
      setReviews(scope === 'network' ? networkReviews : globalReviews);
    } catch (e: any) {
      console.error('Error fetching item details:', e);
      setError(e.message || 'Failed to load details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, scope]);

  const onRefresh = useCallback(() => {
    fetchDetails(true);
  }, [fetchDetails]);

  // Handle scope change
  useEffect(() => {
    if (!id || !user || loading) return;
    const fetchScopeReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await repositories.reviews.getItemReviewsDetail(
          id as string,
          user.id,
          scope
        );
        setReviews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchScopeReviews();
  }, [scope]);

  useEffect(() => {
    fetchDetails();
  }, [id, user]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return 'film-outline';
      case 'series':
        return 'tv-outline';
      case 'youtube':
      case 'video':
        return 'logo-youtube';
      default:
        return 'document-text-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentStart} />
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[Typography.h3, styles.errorText]}>{error || 'Something went wrong'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetails()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]} numberOfLines={1}>
          Details
        </Text>
      </View>

      {/* Main FlatList to hold Header components and reviews */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {/* Item Info Card */}
            <GlassCard style={styles.itemDetailsCard}>
              <View style={styles.itemRow}>
                {item.posterUrl ? (
                  <Image source={{ uri: item.posterUrl }} style={styles.poster} />
                ) : (
                  <View style={styles.posterPlaceholder}>
                    <Ionicons name={getItemIcon(item.type)} size={40} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <View>
                    <Text style={[Typography.h3, styles.title]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[Typography.bodySmall, styles.meta]}>
                      {item.type.toUpperCase()}
                      {item.releaseYear ? ` • ${item.releaseYear}` : ''}
                    </Text>
                  </View>
                  <Text style={[Typography.bodySmall, styles.description]} numberOfLines={5}>
                    {item.description || 'No description available for this item.'}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Ratings Stat Dashboard */}
            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <Ionicons name="people-outline" size={18} color={colors.success} />
                <Text style={styles.statLabel}>Network Rating</Text>
                <Text style={styles.statVal}>
                  {stats.networkCount > 0 ? stats.networkAvg.toFixed(1) : '-'}
                </Text>
                <Text style={styles.statSub}>
                  {stats.networkCount} {stats.networkCount === 1 ? 'review' : 'reviews'}
                </Text>
              </GlassCard>

              <GlassCard style={styles.statCard}>
                <Ionicons name="globe-outline" size={18} color={colors.accentStart} />
                <Text style={styles.statLabel}>Global Rating</Text>
                <Text style={styles.statVal}>
                  {stats.globalCount > 0 ? stats.globalAvg.toFixed(1) : '-'}
                </Text>
                <Text style={styles.statSub}>
                  {stats.globalCount} {stats.globalCount === 1 ? 'review' : 'reviews'}
                </Text>
              </GlassCard>

              {tmdbRating !== null && (
                <GlassCard style={styles.statCard}>
                  <Ionicons name="film-outline" size={18} color={colors.accentEnd} />
                  <Text style={styles.statLabel}>TMDb Rating</Text>
                  <Text style={styles.statVal}>{tmdbRating.toFixed(1)}</Text>
                  <Text style={styles.statSub}>Official TMDb</Text>
                </GlassCard>
              )}
            </View>

            {/* Scope Toggle Selector */}
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
                  My Network ({stats.networkCount})
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
                  Global ({stats.globalCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Section Header */}
            <Text style={[Typography.h3, styles.sectionTitle]}>
              {scope === 'network' ? 'Network Reviews' : 'Global Reviews'}
            </Text>

            {loadingReviews && (
              <ActivityIndicator
                size="small"
                color={colors.accentStart}
                style={{ marginVertical: Spacing.md }}
              />
            )}
          </>
        }
        ListEmptyComponent={
          !loadingReviews ? (
            <View style={styles.emptyTextContainer}>
              <Text style={[Typography.body, styles.emptyText]}>
                {scope === 'network'
                  ? 'No reviews from your network for this item yet.'
                  : 'No public global reviews for this item yet.'}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentStart}
            colors={[colors.accentStart]}
          />
        }
      />
    </SafeAreaView>
  );
}

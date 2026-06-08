import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { NetworkReview } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from '../../src/components/ui/StarRating';
import { useRouter } from 'expo-router';

// Helper to format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recent';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
}

export default function NetworkScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { colors } = useTheme();

  // State
  const [networkReviews, setNetworkReviews] = useState<NetworkReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: c.background,
      },
      loadingText: {
        color: c.textSecondary,
        marginTop: Spacing.sm,
      },
      scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      // Header and Stats
      headerContainer: {
        marginBottom: Spacing.md,
      },
      headerTitle: {
        color: c.textPrimary,
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
      },
      headerSubtitle: {
        color: c.textSecondary,
        fontSize: 14,
        marginBottom: Spacing.md,
      },
      statsCard: {
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      },
      statItem: {
        alignItems: 'center',
      },
      statValue: {
        color: c.textPrimary,
        fontSize: 20,
        fontWeight: 'bold',
      },
      statLabel: {
        color: c.textMuted,
        fontSize: 11,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      statDivider: {
        width: 1,
        height: 30,
        backgroundColor: c.divider,
      },
      // Search Bar
      searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        height: 44,
        marginBottom: Spacing.sm,
      },
      searchInput: {
        flex: 1,
        color: c.textPrimary,
        fontSize: 14,
        marginLeft: Spacing.xs,
      },
      searchClear: {
        padding: Spacing.xs,
      },
      // Filter Tabs & Pills
      filtersContainer: {
        marginBottom: Spacing.md,
        gap: Spacing.xs,
      },
      pillScroll: {
        paddingVertical: 2,
      },
      pillScrollContent: {
        gap: Spacing.xs,
      },
      filterLabel: {
        color: c.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      pillButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: BorderRadius.pill,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: Spacing.xs,
      },
      activePill: {
        borderColor: 'transparent',
      },
      pillText: {
        fontSize: 12,
        fontWeight: '600',
      },
      // Rating Selector
      ratingFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
        paddingTop: Spacing.xs,
        borderTopWidth: 1,
        borderTopColor: c.divider,
      },
      ratingStars: {
        flexDirection: 'row',
        gap: 6,
      },
      ratingStarButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
      },
      ratingStarText: {
        fontSize: 11,
        fontWeight: 'bold',
      },
      // Review Card styles
      card: {
        padding: Spacing.md,
        marginVertical: Spacing.xs,
        width: '100%',
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
      },
      userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: Spacing.sm,
        flex: 1,
        gap: Spacing.xs,
      },
      userName: {
        color: c.textPrimary,
      },
      depthBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.pill,
      },
      depthBadgeText: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: 'bold',
      },
      dateText: {
        color: c.textMuted,
        fontSize: 11,
      },
      itemContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: BorderRadius.md,
        padding: Spacing.xs,
        marginBottom: Spacing.sm,
        alignItems: 'center',
      },
      poster: {
        width: 40,
        height: 56,
        borderRadius: BorderRadius.sm,
        backgroundColor: c.surfaceElevated,
      },
      posterPlaceholder: {
        width: 40,
        height: 56,
        borderRadius: BorderRadius.sm,
        backgroundColor: c.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
      },
      itemInfo: {
        marginLeft: Spacing.sm,
        flex: 1,
      },
      itemTitle: {
        color: c.textPrimary,
        fontSize: 14,
      },
      itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
      },
      itemTypeText: {
        color: c.textSecondary,
        fontSize: 10,
      },
      ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
      },
      ratingText: {
        color: c.starActive,
        fontWeight: 'bold',
      },
      comment: {
        color: c.textSecondary,
        fontStyle: 'italic',
        marginTop: Spacing.xxs,
      },
      tagsSection: {
        marginTop: Spacing.sm,
        gap: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: c.divider,
        paddingTop: Spacing.sm,
      },
      tagGroup: {
        flexDirection: 'column',
        gap: Spacing.xxs,
      },
      tagGroupLabel: {
        color: c.textMuted,
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
      tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: 2,
      },
      tagChip: {
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
      },
      tagText: {
        fontSize: 12,
        fontWeight: '600',
      },
      // Sort controller
      sortContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: Spacing.xs,
      },
      sortOptions: {
        flexDirection: 'row',
        gap: Spacing.sm,
      },
      sortText: {
        fontSize: 12,
        fontWeight: '600',
      },
      // Empty State
      emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl * 2,
        gap: Spacing.sm,
      },
      emptyTitle: {
        color: c.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: Spacing.sm,
      },
      emptyDesc: {
        color: c.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
      },
    })
  );

  const fetchNetwork = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const data = await repositories.reviews.getNetworkReviews(user.id, 2);
      setNetworkReviews(data);
    } catch (e) {
      console.error('Error fetching network:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNetwork(false);
  }, [fetchNetwork]);

  // Filters logic
  const filteredAndSortedReviews = useMemo(() => {
    return networkReviews
      .filter((review) => {
        // Search filter (matches item title or reviewer name)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const reviewer = (review.isAnonymous
            ? (review.reviewerPseudonym || 'Anonymous')
            : review.reviewerName
          ).toLowerCase();
          const itemTitle = review.itemTitle.toLowerCase();
          if (!reviewer.includes(query) && !itemTitle.includes(query)) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (review.itemType !== selectedCategory) {
            return false;
          }
        }

        // Relationship Tier filter
        if (selectedTier !== 'all') {
          const tier = parseInt(selectedTier, 10);
          if (review.depth !== tier) {
            return false;
          }
        }

        // Rating filter
        if (review.rating < minRating) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        } else {
          // Default: Sort by recent (using dates if available)
          const dateA = a.updatedAt || a.createdAt || '';
          const dateB = b.updatedAt || b.createdAt || '';
          if (dateA && dateB) {
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          }
          return 0; // maintain original order otherwise
        }
      });
  }, [networkReviews, searchQuery, selectedCategory, selectedTier, minRating, sortBy]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = networkReviews.length;
    const avgRating = total
      ? Math.round((networkReviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;
    const directFriendsCount = new Set(
      networkReviews.filter((r) => r.depth === 1 && !r.isAnonymous).map((r) => r.reviewerName)
    ).size;

    return { total, avgRating, directFriendsCount };
  }, [networkReviews]);

  if (!user) return null;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentStart} />
        <Text style={[Typography.body, styles.loadingText]}>Mapping network recommendation web...</Text>
      </SafeAreaView>
    );
  }

  const getTierDetails = (depth: number) => {
    switch (depth) {
      case 0:
        return { label: 'You', color: colors.accentStart, bg: 'rgba(0, 210, 255, 0.15)' };
      case 1:
        return { label: 'Friend', color: colors.success, bg: 'rgba(0, 230, 118, 0.15)' };
      case 2:
      default:
        return { label: 'Extended', color: colors.accentEnd, bg: 'rgba(123, 104, 238, 0.15)' };
    }
  };

  const getItemIconName = (type: string) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentStart}
            colors={[colors.accentStart]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header & Mini Dashboard */}
        <View style={styles.headerContainer}>
          <Text style={[Typography.h1, styles.headerTitle]}>Recommendation Web</Text>
          <Text style={[Typography.body, styles.headerSubtitle]}>
            Explore reviews and ratings across your relationship tiers.
          </Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avgRating}★</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.directFriendsCount}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search items or reviewers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters and Pill buttons */}
        <View style={styles.filtersContainer}>
          {/* Tiers Filter Scroll */}
          <Text style={styles.filterLabel}>Relationship Tiers</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillScroll}
            contentContainerStyle={styles.pillScrollContent}
          >
            {[
              { id: 'all', label: 'All Tiers', icon: 'git-network-outline', color: colors.accentStart },
              { id: '0', label: 'You (Tier 0)', icon: 'person-outline', color: colors.accentStart },
              { id: '1', label: 'Friends (Tier 1)', icon: 'people-outline', color: colors.success },
              { id: '2', label: 'Extended (Tier 2)', icon: 'globe-outline', color: colors.accentEnd },
            ].map((tier) => {
              const isActive = selectedTier === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.pillButton,
                    isActive && styles.activePill,
                    { backgroundColor: isActive ? tier.color + '20' : 'rgba(255, 255, 255, 0.02)' },
                  ]}
                  onPress={() => setSelectedTier(tier.id)}
                >
                  <Ionicons name={tier.icon as any} size={14} color={isActive ? tier.color : colors.textSecondary} />
                  <Text style={[styles.pillText, { color: isActive ? tier.color : colors.textSecondary }]}>
                    {tier.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Category Filter Scroll */}
          <Text style={styles.filterLabel}>Content Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillScroll}
            contentContainerStyle={styles.pillScrollContent}
          >
            {[
              { id: 'all', label: 'All', icon: 'apps-outline' },
              { id: 'movie', label: 'Movies', icon: 'film-outline' },
              { id: 'series', label: 'TV Shows', icon: 'tv-outline' },
              { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
              { id: 'video', label: 'Videos', icon: 'videocam-outline' },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.pillButton,
                    isActive && styles.activePill,
                    { backgroundColor: isActive ? colors.accentStart + '20' : 'rgba(255, 255, 255, 0.02)' },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons name={cat.icon as any} size={14} color={isActive ? colors.accentStart : colors.textSecondary} />
                  <Text style={[styles.pillText, { color: isActive ? colors.accentStart : colors.textSecondary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rating filter and Sort controller */}
          <View style={styles.ratingFilterRow}>
            <View style={styles.ratingStars}>
              <Text style={[styles.pillText, { color: colors.textSecondary, alignSelf: 'center', marginRight: 4 }]}>
                Rating:
              </Text>
              {[0, 5, 7, 9].map((rating) => {
                const isActive = minRating === rating;
                return (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingStarButton,
                      {
                        borderColor: isActive ? colors.starActive : 'rgba(255, 255, 255, 0.05)',
                        backgroundColor: isActive ? colors.starActive + '15' : 'rgba(255, 255, 255, 0.02)',
                      },
                    ]}
                    onPress={() => setMinRating(rating)}
                  >
                    <Text
                      style={[
                        styles.ratingStarText,
                        { color: isActive ? colors.starActive : colors.textSecondary },
                      ]}
                    >
                      {rating === 0 ? 'All' : `${rating}+ ★`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort Controller */}
            <View style={styles.sortOptions}>
              <TouchableOpacity
                onPress={() => setSortBy('recent')}
                style={{ opacity: sortBy === 'recent' ? 1 : 0.4 }}
              >
                <Text style={[styles.sortText, { color: sortBy === 'recent' ? colors.accentStart : colors.textSecondary }]}>
                  Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSortBy('rating')}
                style={{ opacity: sortBy === 'rating' ? 1 : 0.4 }}
              >
                <Text style={[styles.sortText, { color: sortBy === 'rating' ? colors.accentStart : colors.textSecondary }]}>
                  Top Rated
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results List */}
        {filteredAndSortedReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="filter-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No matching reviews</Text>
            <Text style={styles.emptyDesc}>
              Try adjusting your filter options or search query to explore other recommendations.
            </Text>
          </View>
        ) : (
          filteredAndSortedReviews.map((rev) => {
            const tierBadge = getTierDetails(rev.depth);
            const reviewerDisplayName = rev.isAnonymous
              ? (rev.reviewerPseudonym || 'Anonymous')
              : rev.reviewerName;

            return (
              <TouchableOpacity
                key={rev.reviewId}
                activeOpacity={0.8}
                onPress={() => {
                  if (rev.itemId) {
                    router.push(`/item/${rev.itemId}`);
                  }
                }}
                style={{ width: '100%' }}
              >
                <GlassCard style={styles.card}>
                  {/* Card Header with User Profile / Depth Info */}
                  <View style={styles.cardHeader}>
                    <Avatar
                      name={reviewerDisplayName}
                      isAnonymous={rev.isAnonymous}
                      size="sm"
                    />
                    <View style={styles.userInfo}>
                      <Text style={[Typography.bodyBold, styles.userName]}>
                        {reviewerDisplayName}
                      </Text>
                      <View style={[styles.depthBadge, { backgroundColor: tierBadge.bg }]}>
                        <Text
                          style={[
                            Typography.caption,
                            styles.depthBadgeText,
                            { color: tierBadge.color },
                          ]}
                        >
                          {tierBadge.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dateText}>
                      {formatRelativeTime(rev.updatedAt || rev.createdAt)}
                    </Text>
                  </View>

                  {/* Card Item details (Movie, Series, Youtube, etc) */}
                  <View style={styles.itemContainer}>
                    {rev.itemPosterUrl ? (
                      <Image source={{ uri: rev.itemPosterUrl }} style={styles.poster} />
                    ) : (
                      <View style={styles.posterPlaceholder}>
                        <Ionicons
                          name={getItemIconName(rev.itemType)}
                          size={20}
                          color={colors.textMuted}
                        />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={[Typography.bodyBold, styles.itemTitle]}>
                        {rev.itemTitle}
                      </Text>
                      <View style={styles.itemMeta}>
                        <Ionicons
                          name={getItemIconName(rev.itemType)}
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text style={[Typography.caption, styles.itemTypeText]}>
                          {rev.itemType.toUpperCase()}
                          {rev.itemReleaseYear ? ` • ${rev.itemReleaseYear}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card rating */}
                  <View style={styles.ratingContainer}>
                    <StarRating rating={rev.rating} readonly size={16} showLabel={false} />
                    <Text style={[Typography.label, styles.ratingText]}>{rev.rating}/10</Text>
                  </View>

                  {/* Comment */}
                  {rev.comment && (
                    <Text style={[Typography.body, styles.comment]}>
                      "{rev.comment}"
                    </Text>
                  )}

                  {/* Liked / Disliked tags */}
                  {((rev.liked && rev.liked.length > 0) || (rev.disliked && rev.disliked.length > 0)) && (
                    <View style={styles.tagsSection}>
                      {rev.liked && rev.liked.length > 0 && (
                        <View style={styles.tagGroup}>
                          <Text style={styles.tagGroupLabel}>Liked:</Text>
                          <View style={styles.tagsContainer}>
                            {rev.liked.map((tag, idx) => (
                              <View
                                key={`liked-${idx}`}
                                style={[
                                  styles.tagChip,
                                  {
                                    borderColor: colors.success + '30',
                                    backgroundColor: colors.success + '08',
                                  },
                                ]}
                              >
                                <Text style={[styles.tagText, { color: colors.success }]}>
                                  ✓ {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {rev.disliked && rev.disliked.length > 0 && (
                        <View style={styles.tagGroup}>
                          <Text style={styles.tagGroupLabel}>Disliked:</Text>
                          <View style={styles.tagsContainer}>
                            {rev.disliked.map((tag, idx) => (
                              <View
                                key={`disliked-${idx}`}
                                style={[
                                  styles.tagChip,
                                  {
                                    borderColor: colors.error + '30',
                                    backgroundColor: colors.error + '08',
                                  },
                                ]}
                              >
                                <Text style={[styles.tagText, { color: colors.error }]}>
                                  ✗ {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

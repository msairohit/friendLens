import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FilterChips } from '../../src/components/ui/FilterChips';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { NetworkSearchResult, ItemType } from '../../src/types';
import { ReviewCard } from '../../src/components/reviews/ReviewCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { GlassCard } from '../../src/components/ui/GlassCard';

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'TV Shows' },
  { key: 'youtube', label: 'YouTube' },
];

export default function SearchScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [results, setResults] = useState<NetworkSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      searchHeader: {
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: c.glassBorder,
      },
      searchBar: {
        paddingHorizontal: Spacing.md,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      listContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      resultGroup: {
        marginVertical: Spacing.sm,
      },
      itemHeaderCard: {
        padding: Spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      itemTitle: {
        color: c.textPrimary,
      },
      ratingBadge: {
        alignItems: 'flex-end',
      },
      ratingText: {
        color: c.starActive,
        fontWeight: 'bold',
        fontSize: 12,
      },
      reviewCountText: {
        color: c.textMuted,
        fontSize: 10,
      },
    })
  );

  const performSearch = useCallback(async (searchQuery: string, type: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const typeFilter = type === 'all' ? undefined : (type as ItemType);
      const searchResults = await repositories.search.searchNetworkReviews(user.id, searchQuery, {
        type: typeFilter,
      });
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      performSearch(query, selectedType);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, selectedType, performSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by movie title or review comment..."
          style={styles.searchBar}
        />
        <FilterChips
          chips={FILTER_CHIPS}
          selected={selectedType}
          onSelect={setSelectedType}
        />
      </View>

      <FlatList
        data={loading && results.length === 0 ? [] : results}
        keyExtractor={(item, index) => item.item.id || index.toString()}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          loading && results.length > 0 ? (
            <View style={{ paddingVertical: Spacing.sm, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accentStart} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (item.item.id) {
                  router.push(`/item/${item.item.id}`);
                }
              }}
            >
              <GlassCard style={styles.itemHeaderCard}>
                <Text style={[Typography.bodyBold, styles.itemTitle]}>{item.item.title}</Text>
                {item.averageRating && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {item.averageRating}/10</Text>
                    <Text style={styles.reviewCountText}>({item.networkReviewCount} reviews)</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
            
            {/* List reviews for this item */}
            {item.reviews.map((rev) => (
              <ReviewCard
                key={rev.reviewId}
                review={{
                  id: rev.reviewId,
                  userId: '',
                  itemId: item.item.id || '',
                  rating: rev.rating,
                  comment: rev.comment,
                  link: null,
                  isPublic: true,
                  sharingLevel: 4,
                  createdAt: '',
                  updatedAt: '',
                  item: item.item,
                  profile: {
                    id: '',
                    username: rev.isAnonymous ? 'anonymous' : rev.reviewerName,
                    displayName: rev.isAnonymous ? (rev.reviewerPseudonym || 'Anonymous') : rev.reviewerName,
                    avatarUrl: null,
                    phone: null,
                    friendTag: '',
                    email: '',
                    createdAt: '',
                    updatedAt: '',
                  },
                  depth: rev.depth,
                  isAnonymous: rev.isAnonymous,
                  displayName: rev.isAnonymous ? (rev.reviewerPseudonym || 'Anonymous') : rev.reviewerName,
                }}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentStart} />
            </View>
          ) : (
            <EmptyState
              title={query ? "No results found" : "Find recommendations"}
              subtitle={query ? "Try checking spelling or changing filter criteria." : "Type a movie, TV show, or YouTube title to see reviews from your connections."}
              icon="search-outline"
            />
          )
        }
      />
    </SafeAreaView>
  );
}

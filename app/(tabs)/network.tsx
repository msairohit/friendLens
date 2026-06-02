import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
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

export default function NetworkScreen() {
  const { user } = useAuthStore();
  const [networkReviews, setNetworkReviews] = useState<NetworkReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

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
      infoCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
      },
      infoTitle: {
        color: c.textPrimary,
        fontSize: 16,
        marginBottom: 4,
      },
      infoSubtitle: {
        color: c.textSecondary,
        fontSize: 13,
      },
      section: {
        marginVertical: Spacing.sm,
      },
      sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        gap: Spacing.xs,
      },
      sectionTitle: {
        fontWeight: 'bold',
      },
      pill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.pill,
      },
      pillText: {
        color: c.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
      },
      emptyText: {
        color: c.textMuted,
        fontStyle: 'italic',
        paddingLeft: Spacing.md,
        marginVertical: Spacing.xs,
      },
      reviewNode: {
        padding: Spacing.md,
        marginVertical: Spacing.xs,
      },
      nodeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
      },
      nodeUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: Spacing.sm,
        gap: Spacing.xs,
      },
      nodeUserName: {
        color: c.textPrimary,
      },
      anonymousBadge: {
        backgroundColor: 'rgba(136, 136, 170, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
      },
      anonymousBadgeText: {
        color: c.textMuted,
        fontSize: 8,
        fontWeight: 'bold',
      },
      nodeContent: {
        paddingLeft: 36, // Align with avatar offset
      },
      itemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
      },
      itemTitle: {
        color: c.textPrimary,
        fontSize: 14,
      },
      ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: 4,
      },
      ratingText: {
        color: c.starActive,
        fontSize: 11,
        fontWeight: 'bold',
      },
      comment: {
        color: c.textSecondary,
        fontSize: 13,
        fontStyle: 'italic',
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

  if (!user) return null;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentStart} />
        <Text style={[Typography.body, styles.loadingText]}>Mapping network...</Text>
      </View>
    );
  }

  // Group by depth
  const ownReviews = networkReviews.filter((r) => r.depth === 0);
  const friendReviews = networkReviews.filter((r) => r.depth === 1);
  const extendedReviews = networkReviews.filter((r) => r.depth === 2);

  const renderSection = (title: string, reviews: NetworkReview[], icon: string, color: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[Typography.h3, styles.sectionTitle, { color }]}>{title}</Text>
        <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
          <Text style={[Typography.caption, styles.pillText]}>{reviews.length}</Text>
        </View>
      </View>

      {reviews.length === 0 ? (
        <Text style={[Typography.body, styles.emptyText]}>No reviews in this tier of your network.</Text>
      ) : (
        reviews.map((rev, index) => (
          <GlassCard key={index} style={styles.reviewNode}>
            <View style={styles.nodeHeader}>
              <Avatar
                name={rev.isAnonymous ? (rev.reviewerPseudonym || 'Anonymous') : rev.reviewerName}
                isAnonymous={rev.isAnonymous}
                size="sm"
              />
              <View style={styles.nodeUserInfo}>
                <Text style={[Typography.bodyBold, styles.nodeUserName]}>
                  {rev.isAnonymous ? (rev.reviewerPseudonym || 'Anonymous') : rev.reviewerName}
                </Text>
                {rev.isAnonymous && (
                  <View style={styles.anonymousBadge}>
                    <Text style={styles.anonymousBadgeText}>ANONYMOUS</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.nodeContent}>
              <View style={styles.itemTitleRow}>
                <Ionicons name="film-outline" size={14} color={colors.textSecondary} />
                <Text style={[Typography.bodyBold, styles.itemTitle]}>{rev.itemTitle}</Text>
              </View>
              <View style={styles.ratingRow}>
                <StarRating rating={rev.rating} readonly size={14} showLabel={false} />
                <Text style={styles.ratingText}>{rev.rating}/10</Text>
              </View>
              {rev.comment && <Text style={[Typography.body, styles.comment]}>"{rev.comment}"</Text>}
            </View>
          </GlassCard>
        ))
      )}
    </View>
  );

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
      >
        <GlassCard style={styles.infoCard}>
          <Text style={[Typography.bodyBold, styles.infoTitle]}>Recommendation Web</Text>
          <Text style={[Typography.body, styles.infoSubtitle]}>
            This map categorizes review recommendations by relationship distance.
          </Text>
        </GlassCard>

        {renderSection('You (Tier 0)', ownReviews, 'person-outline', colors.accentStart)}
        {renderSection('Friends (Tier 1)', friendReviews, 'people-outline', colors.success)}
        {renderSection('Extended Network (Tier 2)', extendedReviews, 'git-network-outline', colors.accentEnd)}
      </ScrollView>
    </SafeAreaView>
  );
}

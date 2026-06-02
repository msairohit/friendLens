import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useTheme, useStyles } from '../../stores/themeStore';
import { Spacing, BorderRadius } from '../../constants/layout';
import { Typography } from '../../constants/typography';
import { GlassCard } from '../ui/GlassCard';
import { Avatar } from '../ui/Avatar';
import { StarRating } from '../ui/StarRating';
import { FeedReview } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface ReviewCardProps {
  review: FeedReview;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
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

export function ReviewCard({ review }: ReviewCardProps) {
  const { colors } = useTheme();
  
  const styles = useStyles((c) =>
    StyleSheet.create({
      card: {
        padding: Spacing.md,
        marginVertical: Spacing.xs,
        width: '100%',
      },
      header: {
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
      badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.pill,
      },
      badgeText: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: 'bold',
      },
      date: {
        color: c.textMuted,
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
    })
  );

  const getDepthBadge = (depth: number) => {
    switch (depth) {
      case 0:
        return { label: 'You', color: colors.accentStart, bg: 'rgba(0, 210, 255, 0.15)' };
      case 1:
        return { label: 'Friend', color: colors.success, bg: 'rgba(0, 230, 118, 0.15)' };
      case 2:
      default:
        return { label: "Friend's Friend", color: colors.accentEnd, bg: 'rgba(123, 104, 238, 0.15)' };
    }
  };

  const badge = getDepthBadge(review.depth);

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

  return (
    <GlassCard style={styles.card}>
      {/* Header with User Info */}
      <View style={styles.header}>
        <Avatar
          name={review.displayName}
          isAnonymous={review.isAnonymous}
          size="sm"
        />
        <View style={styles.userInfo}>
          <Text style={[Typography.bodyBold, styles.userName]}>
            {review.displayName}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[Typography.caption, styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>
        <Text style={[Typography.caption, styles.date]}>
          {formatRelativeTime(review.updatedAt || review.createdAt)}
        </Text>
      </View>

      {/* Item info (Movie/Show) */}
      <View style={styles.itemContainer}>
        {review.item.posterUrl ? (
          <Image source={{ uri: review.item.posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Ionicons name={getItemIcon(review.item.type)} size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={[Typography.bodyBold, styles.itemTitle]}>
            {review.item.title}
          </Text>
          <View style={styles.itemMeta}>
            <Ionicons name={getItemIcon(review.item.type)} size={12} color={colors.textSecondary} />
            <Text style={[Typography.caption, styles.itemTypeText]}>
              {review.item.type.toUpperCase()}
              {review.item.releaseYear ? ` • ${review.item.releaseYear}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Rating & Comment */}
      <View style={styles.ratingContainer}>
        <StarRating rating={review.rating} readonly size={16} showLabel={false} />
        <Text style={[Typography.label, styles.ratingText]}>{review.rating}/10</Text>
      </View>

      {review.comment && (
        <Text style={[Typography.body, styles.comment]}>
          "{review.comment}"
        </Text>
      )}
    </GlassCard>
  );
}

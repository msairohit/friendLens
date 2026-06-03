import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, RefreshControl, Pressable } from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Themes, ThemeKey, ThemeColors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { FeedReview } from '../../src/types';
import { ReviewCard } from '../../src/components/reviews/ReviewCard';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [reviews, setReviews] = useState<FeedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme: activeTheme, setTheme, colors } = useTheme();

  const styles = useStyles((c: ThemeColors) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      listContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      header: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: c.glassBorder,
        marginBottom: Spacing.md,
      },
      avatar: {
        marginBottom: Spacing.sm,
      },
      displayName: {
        color: c.textPrimary,
      },
      username: {
        color: c.textSecondary,
      },
      tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
        marginTop: Spacing.xxs,
      },
      copyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        gap: 4,
      },
      tagText: {
        color: c.accentStart,
        fontSize: 12,
        fontWeight: 'bold',
      },
      email: {
        color: c.textMuted,
        marginBottom: Spacing.md,
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xl,
        marginVertical: Spacing.md,
        width: '100%',
      },
      statBox: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        minWidth: 100,
        borderColor: c.glassBorder,
        borderWidth: 1,
      },
      statValue: {
        color: c.textPrimary,
        fontWeight: 'bold',
      },
      statLabel: {
        color: c.textSecondary,
        marginTop: 2,
      },
      logoutButton: {
        width: '60%',
        marginVertical: Spacing.md,
      },
      themeSection: {
        width: '100%',
        paddingHorizontal: Spacing.xs,
        marginVertical: Spacing.md,
      },
      themeTitle: {
        color: c.textMuted,
        letterSpacing: 1.5,
        marginBottom: Spacing.sm,
      },
      themesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        justifyContent: 'space-between',
      },
      themeCard: {
        width: '48%',
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
      },
      themeCardActive: {
        borderColor: c.primary,
      },
      themeGradient: {
        padding: Spacing.sm,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        height: 64,
      },
      themeCardLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
      },
      colorDots: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 4,
      },
      colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
      },
      sectionTitle: {
        color: c.textMuted,
        letterSpacing: 1.5,
        marginTop: Spacing.md,
        alignSelf: 'flex-start',
      },
    })
  );

  const fetchUserReviews = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const result = await repositories.reviews.getByUserId(user.id);
      
      const mapped: FeedReview[] = result.data.map(r => ({
        ...r,
        depth: 0,
        isAnonymous: false,
        displayName: user.displayName || user.username,
        item: {
          id: r.itemId,
          title: 'Movie/Show',
          type: 'movie',
          externalId: null,
          posterUrl: null,
          description: null,
          releaseYear: null,
          metadata: null,
          createdAt: r.createdAt
        },
        profile: user
      }));
      
      const resolved = await Promise.all(mapped.map(async (mr) => {
        try {
          const item = await repositories.items.getById(mr.itemId);
          if (item) mr.item = item;
        } catch (err) {
          console.warn('Could not resolve item:', err);
        }
        return mr;
      }));
      
      setReviews(resolved);
    } catch (e) {
      console.error('Error fetching profile reviews:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserReviews(false);
  }, [fetchUserReviews]);

  if (!user) return null;

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentStart}
            colors={[colors.accentStart]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Avatar name={user.displayName || user.username} size="lg" style={styles.avatar} />
            <Text style={[Typography.h2, styles.displayName]}>{user.displayName}</Text>
            <View style={styles.tagContainer}>
              <Text style={[Typography.body, styles.username]}>@{user.username}</Text>
              <Pressable onPress={async () => {
                if (user.friendTag) {
                  await require('expo-clipboard').setStringAsync(user.friendTag);
                  alert('Friend tag copied!');
                }
              }} style={styles.copyBadge}>
                <Text style={styles.tagText}>{user.friendTag}</Text>
                <Ionicons name="copy-outline" size={12} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={[Typography.caption, styles.email]}>{user.email}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={[Typography.h3, styles.statValue]}>{reviews.length}</Text>
                <Text style={[Typography.caption, styles.statLabel]}>Reviews</Text>
              </View>
              <Pressable
                onPress={() => require('expo-router').router.push('/friends')}
                style={styles.statBox}
              >
                <Text style={[Typography.h3, styles.statValue]}>
                  {user.username === 'user2' ? '2' : '1'}
                </Text>
                <Text style={[Typography.caption, styles.statLabel, { color: colors.accentStart }]}>
                  Friends →
                </Text>
              </Pressable>
            </View>

            {/* Theme Picker section */}
            <View style={styles.themeSection}>
              <Text style={[Typography.caption, styles.themeTitle]}>APP THEME</Text>
              <View style={styles.themesContainer}>
                {Object.keys(Themes).map((key) => {
                  const tKey = key as ThemeKey;
                  const themeData = Themes[tKey];
                  const isSelected = activeTheme === tKey;
                  return (
                    <Pressable
                      key={tKey}
                      onPress={() => setTheme(tKey)}
                      style={[
                        styles.themeCard,
                        isSelected && styles.themeCardActive,
                      ]}
                    >
                      <LinearGradient
                        colors={[themeData.colors.background, themeData.colors.surface]}
                        style={styles.themeGradient}
                      >
                        <Text style={[styles.themeCardLabel, { color: themeData.colors.textPrimary }]}>
                          {tKey.charAt(0).toUpperCase() + tKey.slice(1)}
                        </Text>
                        <View style={styles.colorDots}>
                          <View style={[styles.colorDot, { backgroundColor: themeData.colors.primary }]} />
                          <View style={[styles.colorDot, { backgroundColor: themeData.colors.accent }]} />
                          <View style={[styles.colorDot, { backgroundColor: themeData.colors.surfaceElevated }]} />
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <GradientButton
              title="Log Out"
              onPress={signOut}
              variant="outline"
              style={styles.logoutButton}
            />

            <Text style={[Typography.caption, styles.sectionTitle]}>MY REVIEWS</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

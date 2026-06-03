import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, SafeAreaView, Pressable, Image } from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { StarRating } from '../../src/components/ui/StarRating';
import { FilterChips } from '../../src/components/ui/FilterChips';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { ItemType } from '../../src/types';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchTMDb, TMDbItem } from '../../src/lib/tmdb';

const TYPE_CHIPS = [
  { key: 'movie', label: 'Movie' },
  { key: 'series', label: 'TV Show' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'video', label: 'Other Video' },
];

const SHARING_LEVELS = [
  { level: 0, label: 'Private', desc: 'Only me, no one else can see', icon: 'lock-closed-outline' as const },
  { level: 1, label: 'Direct Friends', desc: 'Only direct friends can see', icon: 'people-outline' as const },
  { level: 2, label: 'Friends of Friends (Anon)', desc: 'Friends see details; their friends see anonymously', icon: 'eye-off-outline' as const },
  { level: 3, label: 'Friends of Friends (Detailed)', desc: 'Friends and their friends see name & details', icon: 'people-circle-outline' as const },
  { level: 4, label: 'Public', desc: 'Anyone can view this review', icon: 'globe-outline' as const },
];

export default function AddReviewScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('movie');
  const [rating, setRating] = useState(7); // Default average rating
  const [sharingLevel, setSharingLevel] = useState(1); // Default to Direct Friends
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  // TMDb-related states
  const [selectedMovie, setSelectedMovie] = useState<TMDbItem | null>(null);
  const [searchResults, setSearchResults] = useState<TMDbItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Clear suggestions and selected movie when category changes
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setTitle('');
    setSelectedMovie(null);
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Debounced search for TMDb
  useEffect(() => {
    if (type !== 'movie' && type !== 'series') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (!title.trim() || selectedMovie?.title === title) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const results = await searchTMDb(title, type);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('TMDb search error:', err);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [title, type, selectedMovie]);

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      keyboardView: {
        flex: 1,
      },
      scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      formCard: {
        padding: Spacing.md,
        width: '100%',
      },
      sectionLabel: {
        color: c.textPrimary,
        marginBottom: Spacing.xs,
      },
      chipsWrapper: {
        marginBottom: Spacing.md,
        marginLeft: -Spacing.base, // negate filter chips default padding to align
      },
      label: {
        color: c.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
      },
      input: {
        backgroundColor: c.surfaceElevated,
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        color: c.textPrimary,
        fontSize: 15,
      },
      textArea: {
        height: 100,
        textAlignVertical: 'top',
      },
      ratingWrapper: {
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: BorderRadius.md,
        borderColor: c.glassBorder,
        borderWidth: 1,
      },
      sharingContainer: {
        marginTop: Spacing.sm,
        gap: Spacing.xs,
      },
      sharingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'transparent',
      },
      sharingOptionSelected: {
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        borderColor: c.primary,
      },
      sharingTextContainer: {
        flex: 1,
        marginLeft: Spacing.sm,
      },
      sharingTitle: {
        color: c.textPrimary,
        fontSize: 14,
        fontWeight: '600',
      },
      sharingDesc: {
        color: c.textSecondary,
        fontSize: 11,
        marginTop: 2,
      },
      submitButton: {
        marginTop: Spacing.lg,
        width: '100%',
      },
      dropdownContainer: {
        backgroundColor: c.surfaceElevated,
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.xs,
        maxHeight: 200,
        overflow: 'hidden',
      },
      dropdownItem: {
        flexDirection: 'row',
        padding: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: c.glassBorder,
        alignItems: 'center',
      },
      dropdownPoster: {
        width: 30,
        height: 45,
        borderRadius: BorderRadius.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      dropdownTextContainer: {
        flex: 1,
        marginLeft: Spacing.sm,
      },
      dropdownTitle: {
        color: c.textPrimary,
        fontSize: 14,
        fontWeight: '600',
      },
      dropdownYear: {
        color: c.textSecondary,
        fontSize: 11,
        marginTop: 2,
      },
      selectedCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: 'rgba(108, 92, 231, 0.05)',
        borderColor: c.primary,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'flex-start',
        marginTop: Spacing.xs,
        position: 'relative',
      },
      selectedPoster: {
        width: 100,
        height: 150,
        borderRadius: BorderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      selectedInfo: {
        flex: 1,
        marginLeft: Spacing.md,
        paddingRight: Spacing.md,
      },
      selectedTitle: {
        color: c.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
      },
      selectedYear: {
        color: c.textSecondary,
        fontSize: 13,
        marginTop: 2,
      },
      selectedDesc: {
        color: c.textMuted,
        fontSize: 12,
        marginTop: 6,
        lineHeight: 16,
      },
      clearButton: {
        position: 'absolute',
        top: Spacing.xs,
        right: Spacing.xs,
        padding: Spacing.xs,
      },
    })
  );

  const handleSubmit = async () => {
    if (!user) return;
    
    // Ensure title is present or movie is selected
    const finalTitle = selectedMovie ? selectedMovie.title : title.trim();
    if (!finalTitle) {
      Alert.alert('Validation Error', 'Please enter a title or select a movie/show.');
      return;
    }

    if ((type === 'movie' || type === 'series') && !selectedMovie) {
      Alert.alert(
        'Validation Error',
        `Please select a matching ${type === 'movie' ? 'Movie' : 'TV Show'} from the search results to ensure accurate data sharing.`
      );
      return;
    }

    setLoading(false);
    try {
      setLoading(true);

      // 1. Create or find the item
      const item = await repositories.items.findOrCreate({
        title: finalTitle,
        type: type as ItemType,
        externalId: selectedMovie?.externalId || undefined,
        posterUrl: selectedMovie
          ? selectedMovie.posterUrl
          : (type === 'youtube' && link ? `https://img.youtube.com/vi/${extractYouTubeId(link)}/hqdefault.jpg` : undefined),
        description: selectedMovie?.description || undefined,
        releaseYear: selectedMovie?.releaseYear || undefined,
      });

      // 2. Submit the review
      await repositories.reviews.create(user.id, {
        itemId: item.id,
        rating,
        comment: comment.trim() || undefined,
        link: link.trim() || undefined,
        isPublic: sharingLevel === 4,
        sharingLevel,
      });

      Alert.alert('Success', 'Your review has been posted!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form and navigate back to Feed
            setTitle('');
            setSelectedMovie(null);
            setSearchResults([]);
            setShowDropdown(false);
            setComment('');
            setLink('');
            setRating(7);
            setSharingLevel(1);
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.formCard}>
            <Text style={[Typography.h3, styles.sectionLabel]}>Category</Text>
            <View style={styles.chipsWrapper}>
              <FilterChips
                chips={TYPE_CHIPS}
                selected={type}
                onSelect={handleTypeChange}
              />
            </View>

            <Text style={[Typography.h3, styles.label]}>Title</Text>
            {selectedMovie ? (
              <View style={styles.selectedCard}>
                {selectedMovie.posterUrl ? (
                  <Image source={{ uri: selectedMovie.posterUrl }} style={styles.selectedPoster} />
                ) : (
                  <View style={styles.selectedPoster} />
                )}
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedTitle} numberOfLines={2}>{selectedMovie.title}</Text>
                  {selectedMovie.releaseYear && (
                    <Text style={styles.selectedYear}>{selectedMovie.releaseYear}</Text>
                  )}
                  {selectedMovie.description && (
                    <Text style={styles.selectedDesc} numberOfLines={5}>{selectedMovie.description}</Text>
                  )}
                </View>
                <Pressable onPress={() => setSelectedMovie(null)} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={type === 'movie' || type === 'series' ? "Type to search..." : "e.g. Inception, Breaking Bad..."}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                {showDropdown && searchResults.length > 0 && (
                  <ScrollView style={styles.dropdownContainer} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                    {searchResults.map((item) => (
                      <Pressable
                        key={item.externalId}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedMovie(item);
                          setTitle(item.title);
                          setShowDropdown(false);
                        }}
                      >
                        {item.posterUrl ? (
                          <Image source={{ uri: item.posterUrl }} style={styles.dropdownPoster} />
                        ) : (
                          <View style={styles.dropdownPoster} />
                        )}
                        <View style={styles.dropdownTextContainer}>
                          <Text style={styles.dropdownTitle} numberOfLines={1}>{item.title}</Text>
                          {item.releaseYear && (
                            <Text style={styles.dropdownYear}>{item.releaseYear}</Text>
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <Text style={[Typography.h3, styles.label]}>Rating</Text>
            <View style={styles.ratingWrapper}>
              <StarRating rating={rating} onRatingChange={setRating} size={30} />
            </View>

            <Text style={[Typography.h3, styles.label]}>Review / Comment (Optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="What did you think of it?"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
            />

            <Text style={[Typography.h3, styles.label]}>URL / Link (Optional)</Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="e.g. YouTube or IMDb link..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={[Typography.h3, styles.label]}>Sharing / Privacy Option</Text>
            <View style={styles.sharingContainer}>
              {SHARING_LEVELS.map((opt) => {
                const isSelected = sharingLevel === opt.level;
                return (
                  <Pressable
                    key={opt.level}
                    onPress={() => setSharingLevel(opt.level)}
                    style={[
                      styles.sharingOption,
                      isSelected && styles.sharingOptionSelected,
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <View style={styles.sharingTextContainer}>
                      <Text style={styles.sharingTitle}>{opt.label}</Text>
                      <Text style={styles.sharingDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <GradientButton
              title={loading ? 'Posting...' : 'Share with Network'}
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={loading}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

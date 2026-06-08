import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { StarRating } from '../../src/components/ui/StarRating';
import { FilterChips } from '../../src/components/ui/FilterChips';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { ItemType } from '../../src/types';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchTMDb, TMDbItem } from '../../src/lib/tmdb';
import { LinearGradient } from 'expo-linear-gradient';

const TYPE_CHIPS = [
  { key: 'movie', label: '🎬 Movie' },
  { key: 'series', label: '📺 TV Show' },
  { key: 'youtube', label: '▶️ YouTube' },
  { key: 'video', label: '🎥 Other Video' },
];

const SHARING_LEVELS = [
  { level: 0, label: 'Private', icon: 'lock-closed-outline' as const, color: '#666688' },
  { level: 1, label: 'Friends', icon: 'people-outline' as const, color: '#00D2FF' },
  { level: 2, label: 'Anon FoF', icon: 'eye-off-outline' as const, color: '#A855F7' },
  { level: 3, label: 'FoF Detail', icon: 'people-circle-outline' as const, color: '#7B68EE' },
  { level: 4, label: 'Public', icon: 'globe-outline' as const, color: '#00E676' },
];

const SHARING_DESCRIPTIONS = [
  'Only you can see this review',
  'Only direct friends can see this',
  'Friends see details; their friends see anonymously',
  'Friends and their friends see your name & details',
  'Anyone can view this review',
];

// Section header component with a left gradient accent bar
function SectionHeader({ icon, title, subtitle, colors }: { icon: string; title: string; subtitle?: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
      <LinearGradient
        colors={[colors.accentStart, colors.accentEnd]}
        style={{ width: 3, height: 36, borderRadius: 2 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name={icon as any} size={16} color={colors.accentStart} />
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Styled input with an optional leading icon
function StyledInput({
  value,
  onChangeText,
  placeholder,
  icon,
  multiline,
  keyboardType,
  autoCapitalize,
  colors,
  styles,
  onSubmitEditing,
  rightElement,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon?: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  colors: any;
  styles: any;
  onSubmitEditing?: () => void;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[
      styles.inputWrapper,
      focused && { borderColor: colors.accentStart, backgroundColor: colors.surfaceHover },
    ]}>
      {icon ? (
        <Ionicons name={icon as any} size={18} color={focused ? colors.accentStart : colors.textMuted} style={{ marginRight: 8 }} />
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.inputText, multiline && styles.textAreaText]}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
      />
      {rightElement}
    </View>
  );
}

export default function AddReviewScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('movie');
  const [rating, setRating] = useState(7);
  const [sharingLevel, setSharingLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const { colors, gradients } = useTheme();

  // TMDb-related states
  const [selectedMovie, setSelectedMovie] = useState<TMDbItem | null>(null);
  const [searchResults, setSearchResults] = useState<TMDbItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Liked/Disliked states
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [newLiked, setNewLiked] = useState('');
  const [newDisliked, setNewDisliked] = useState('');
  const addLikedTag = () => {
    const tag = newLiked.trim();
    if (tag && !liked.includes(tag)) {
      setLiked([...liked, tag]);
    }
    setNewLiked('');
  };

  const removeLikedTag = (tag: string) => {
    setLiked(liked.filter((t) => t !== tag));
  };

  const addDislikedTag = () => {
    const tag = newDisliked.trim();
    if (tag && !disliked.includes(tag)) {
      setDisliked([...disliked, tag]);
    }
    setNewDisliked('');
  };

  const removeDislikedTag = (tag: string) => {
    setDisliked(disliked.filter((t) => t !== tag));
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setTitle('');
    setSelectedMovie(null);
    setSearchResults([]);
    setShowDropdown(false);
  };

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
      container: { flex: 1, backgroundColor: c.background },
      keyboardView: { flex: 1 },
      // Header
      headerGradient: {
        paddingTop: 8,
        paddingBottom: 16,
        paddingHorizontal: Spacing.md,
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      },
      headerTitleBlock: { flex: 1 },
      headerTitle: {
        color: c.textPrimary,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
      },
      headerSubtitle: {
        color: c.textMuted,
        fontSize: 13,
        marginTop: 2,
      },
      // Scroll
      scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: 100,
        gap: 14,
      },
      // Section cards
      section: {
        borderRadius: BorderRadius.lg,
        backgroundColor: c.glassBackground,
        borderWidth: 1,
        borderColor: c.glassBorder,
        padding: 14,
        overflow: 'hidden',
      },
      // Step badge
      stepBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 2,
      },
      stepBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
      },
      // Input
      inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surfaceElevated,
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        minHeight: 48,
      },
      inputText: {
        flex: 1,
        color: c.textPrimary,
        fontSize: 15,
        padding: 0,
      },
      textAreaText: {
        height: 90,
        textAlignVertical: 'top',
      },
      // Dropdown
      dropdownContainer: {
        backgroundColor: c.surfaceElevated,
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        marginTop: 4,
        maxHeight: 220,
        overflow: 'hidden',
      },
      dropdownItem: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.glassBorder,
        alignItems: 'center',
        gap: 10,
      },
      dropdownPoster: {
        width: 32,
        height: 48,
        borderRadius: BorderRadius.sm,
        backgroundColor: c.surfaceHover,
      },
      dropdownTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
      dropdownYear: { color: c.textSecondary, fontSize: 11, marginTop: 2 },
      // Selected movie card
      selectedCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(108, 92, 231, 0.07)',
        borderColor: c.primary + '50',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        position: 'relative',
      },
      selectedPoster: {
        width: 80,
        height: 120,
        backgroundColor: c.surfaceHover,
      },
      selectedInfo: {
        flex: 1,
        padding: 10,
        paddingRight: 32,
        justifyContent: 'center',
        gap: 4,
      },
      selectedTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700', lineHeight: 20 },
      selectedYear: { color: c.textMuted, fontSize: 12 },
      selectedDesc: { color: c.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 2 },
      clearButton: { position: 'absolute', top: 6, right: 6, padding: 4 },
      // Rating
      ratingCard: {
        backgroundColor: 'rgba(255, 215, 0, 0.04)',
        borderColor: 'rgba(255, 215, 0, 0.15)',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 4,
      },
      // Sharing
      sharingScroll: { marginTop: 6 },
      sharingPillsRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
      sharingPill: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        gap: 4,
        minWidth: 80,
        backgroundColor: c.surfaceElevated,
      },
      sharingPillLabel: { fontSize: 11, fontWeight: '700' },
      sharingDesc: {
        marginTop: 8,
        padding: 10,
        backgroundColor: c.surfaceElevated,
        borderRadius: BorderRadius.sm,
      },
      sharingDescText: { color: c.textSecondary, fontSize: 12, lineHeight: 17 },
      // Tags
      tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
      tagInputFlex: { flex: 1 },
      tagAddBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
      },
      tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 8,
      },
      tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 5,
      },
      tagText: { fontSize: 12, fontWeight: '600' },
      // Divider
      divider: {
        height: 1,
        backgroundColor: c.divider,
        marginVertical: 10,
      },
      // Chips wrapper
      chipsWrapper: { marginLeft: -Spacing.base },
      // Bottom submit area
      submitArea: {
        paddingHorizontal: Spacing.md,
        paddingTop: 10,
        paddingBottom: 4,
      },
    })
  );

  const handleSubmit = async () => {
    if (!user) return;
    const finalTitle = selectedMovie ? selectedMovie.title : title.trim();
    if (!finalTitle) {
      Alert.alert('Missing Title', 'Please enter a title or select a movie/show.');
      return;
    }
    if ((type === 'movie' || type === 'series') && !selectedMovie) {
      Alert.alert(
        'Select from Results',
        `Please select a matching ${type === 'movie' ? 'Movie' : 'TV Show'} from the search results.`
      );
      return;
    }
    setLoading(false);
    try {
      setLoading(true);
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
      await repositories.reviews.create(user.id, {
        itemId: item.id,
        rating,
        comment: comment.trim() || undefined,
        link: link.trim() || undefined,
        isPublic: sharingLevel === 4,
        sharingLevel,
        liked,
        disliked,
      });
      Alert.alert('✅ Review Shared!', 'Your review has been posted to your network.', [
        {
          text: 'Done',
          onPress: () => {
            setTitle(''); setSelectedMovie(null); setSearchResults([]);
            setShowDropdown(false); setComment(''); setLink('');
            setRating(7); setSharingLevel(1);
            setLiked([]); setDisliked([]);
            setNewLiked(''); setNewDisliked('');
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

  const selectedSharing = SHARING_LEVELS.find(s => s.level === sharingLevel);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* ─── Header ─── */}
        <LinearGradient
          colors={[colors.background, colors.surface]}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <LinearGradient
              colors={[colors.accentStart, colors.accentEnd]}
              style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="create" size={20} color="#FFF" />
            </LinearGradient>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerTitle}>New Review</Text>
              <Text style={styles.headerSubtitle}>Share your take with the network</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Section 1: Category ─── */}
          <View style={styles.section}>
            <SectionHeader icon="grid-outline" title="Category" colors={colors} />
            <View style={styles.chipsWrapper}>
              <FilterChips chips={TYPE_CHIPS} selected={type} onSelect={handleTypeChange} />
            </View>
          </View>

          {/* ─── Section 2: Title / Search ─── */}
          <View style={styles.section}>
            <SectionHeader
              icon="search-outline"
              title="Title"
              subtitle={type === 'movie' || type === 'series' ? 'Search and select from TMDb results' : 'Enter the title manually'}
              colors={colors}
            />
            {selectedMovie ? (
              <View style={styles.selectedCard}>
                {selectedMovie.posterUrl ? (
                  <Image source={{ uri: selectedMovie.posterUrl }} style={styles.selectedPoster} />
                ) : (
                  <View style={[styles.selectedPoster, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="film-outline" size={28} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedTitle} numberOfLines={2}>{selectedMovie.title}</Text>
                  {selectedMovie.releaseYear ? (
                    <Text style={styles.selectedYear}>{selectedMovie.releaseYear}</Text>
                  ) : null}
                  {selectedMovie.description ? (
                    <Text style={styles.selectedDesc} numberOfLines={3}>{selectedMovie.description}</Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 11, fontWeight: '600' }}>Selected from TMDb</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedMovie(null)} style={styles.clearButton}>
                  <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 2 }}>
                    <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                  </View>
                </Pressable>
              </View>
            ) : (
              <View>
                <StyledInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={type === 'movie' || type === 'series' ? 'Type to search TMDb...' : 'e.g. Inception, Breaking Bad...'}
                  icon="film-outline"
                  colors={colors}
                  styles={styles}
                />
                {showDropdown && searchResults.length > 0 && (
                  <ScrollView style={styles.dropdownContainer} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
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
                          <View style={[styles.dropdownPoster, { alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="film-outline" size={16} color={colors.textMuted} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dropdownTitle} numberOfLines={1}>{item.title}</Text>
                          {item.releaseYear ? (
                            <Text style={styles.dropdownYear}>{item.releaseYear}</Text>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* ─── Section 3: Rating ─── */}
          <View style={styles.section}>
            <SectionHeader icon="star-outline" title="Your Rating" colors={colors} />
            <View style={styles.ratingCard}>
              <StarRating rating={rating} onRatingChange={setRating} size={28} />
            </View>
          </View>

          {/* ─── Section 4: Review Comment ─── */}
          <View style={styles.section}>
            <SectionHeader icon="chatbubble-ellipses-outline" title="Review" subtitle="Optional · What did you think?" colors={colors} />
            <StyledInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your thoughts, highlights, or recommendations..."
              icon="pencil-outline"
              multiline
              colors={colors}
              styles={styles}
            />
          </View>

          {/* ─── Section 5: Pros & Cons ─── */}
          <View style={styles.section}>
            <SectionHeader icon="thumbs-up-outline" title="Highlights" subtitle="Optional · What stood out?" colors={colors} />

            {/* Liked */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
                <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>LIKED</Text>
              </View>
              <View style={styles.tagInputRow}>
                <View style={styles.tagInputFlex}>
                  <StyledInput
                    value={newLiked}
                    onChangeText={setNewLiked}
                    placeholder="e.g. Philosophy, Cinematography..."
                    icon="add-circle-outline"
                    colors={colors}
                    styles={styles}
                    onSubmitEditing={addLikedTag}
                  />
                </View>
                <Pressable onPress={addLikedTag}>
                  <LinearGradient
                    colors={[colors.success + 'CC', colors.success]}
                    style={[styles.tagAddBtn]}
                  >
                    <Ionicons name="add" size={22} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
              {liked.length > 0 && (
                <View style={styles.tagsRow}>
                  {liked.map((tag) => (
                    <View key={tag} style={[styles.tagChip, { borderColor: colors.success + '50', backgroundColor: colors.success + '18' }]}>
                      <Ionicons name="checkmark" size={12} color={colors.success} />
                      <Text style={[styles.tagText, { color: colors.success }]}>{tag}</Text>
                      <Pressable onPress={() => removeLikedTag(tag)}>
                        <Ionicons name="close" size={13} color={colors.success + 'AA'} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Disliked */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error }} />
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>DISLIKED</Text>
              </View>
              <View style={styles.tagInputRow}>
                <View style={styles.tagInputFlex}>
                  <StyledInput
                    value={newDisliked}
                    onChangeText={setNewDisliked}
                    placeholder="e.g. Slow pacing, Weak ending..."
                    icon="remove-circle-outline"
                    colors={colors}
                    styles={styles}
                    onSubmitEditing={addDislikedTag}
                  />
                </View>
                <Pressable onPress={addDislikedTag}>
                  <LinearGradient
                    colors={[colors.error + 'CC', colors.error]}
                    style={[styles.tagAddBtn]}
                  >
                    <Ionicons name="add" size={22} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
              {disliked.length > 0 && (
                <View style={styles.tagsRow}>
                  {disliked.map((tag) => (
                    <View key={tag} style={[styles.tagChip, { borderColor: colors.error + '50', backgroundColor: colors.error + '18' }]}>
                      <Ionicons name="close" size={12} color={colors.error} />
                      <Text style={[styles.tagText, { color: colors.error }]}>{tag}</Text>
                      <Pressable onPress={() => removeDislikedTag(tag)}>
                        <Ionicons name="close" size={13} color={colors.error + 'AA'} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ─── Section 6: Link ─── */}
          <View style={styles.section}>
            <SectionHeader icon="link-outline" title="Link" subtitle="Optional · YouTube, IMDb, etc." colors={colors} />
            <StyledInput
              value={link}
              onChangeText={setLink}
              placeholder="https://..."
              icon="globe-outline"
              autoCapitalize="none"
              keyboardType="url"
              colors={colors}
              styles={styles}
            />
          </View>

          {/* ─── Section 7: Privacy ─── */}
          <View style={styles.section}>
            <SectionHeader icon="shield-outline" title="Privacy" subtitle="Who can see this review?" colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sharingScroll}>
              <View style={styles.sharingPillsRow}>
                {SHARING_LEVELS.map((opt) => {
                  const isSelected = sharingLevel === opt.level;
                  return (
                    <Pressable
                      key={opt.level}
                      onPress={() => setSharingLevel(opt.level)}
                      style={[
                        styles.sharingPill,
                        isSelected
                          ? { borderColor: opt.color, backgroundColor: opt.color + '22' }
                          : { borderColor: colors.glassBorder },
                      ]}
                    >
                      <Ionicons name={opt.icon} size={18} color={isSelected ? opt.color : colors.textMuted} />
                      <Text style={[styles.sharingPillLabel, { color: isSelected ? opt.color : colors.textMuted }]}>
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={12} color={opt.color} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            {selectedSharing && (
              <View style={styles.sharingDesc}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={selectedSharing.icon} size={14} color={selectedSharing.color} />
                  <Text style={[styles.sharingDescText, { color: selectedSharing.color, fontWeight: '600' }]}>
                    {selectedSharing.label}:{'  '}
                    <Text style={[styles.sharingDescText, { fontWeight: '400', color: colors.textSecondary }]}>
                      {SHARING_DESCRIPTIONS[selectedSharing.level]}
                    </Text>
                  </Text>
                </View>
              </View>
            )}
          </View>

        </ScrollView>

        {/* ─── Floating Submit Button ─── */}
        <View style={[styles.submitArea, { borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.background }]}>
          <GradientButton
            title={loading ? 'Posting...' : '✦  Share with Network'}
            onPress={handleSubmit}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

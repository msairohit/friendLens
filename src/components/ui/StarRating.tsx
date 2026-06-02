// ============================================================
// StarRating — Interactive 1-10 star rating component
// ============================================================

import React, { useCallback } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles } from '../../stores/themeStore';
import { Spacing } from '../../constants/layout';
import { Typography, FontFamily } from '../../constants/typography';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showLabel?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Star({
  index,
  filled,
  size,
  onPress,
  readonly,
}: {
  index: number;
  filled: boolean;
  size: number;
  onPress: (index: number) => void;
  readonly: boolean;
}) {
  const scale = useSharedValue(1);
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (readonly) return;
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 500 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(index + 1);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={animatedStyle}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      disabled={readonly}
    >
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? colors.starActive : colors.starInactive}
      />
    </AnimatedPressable>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Very Bad',
  3: 'Bad',
  4: 'Below Average',
  5: 'Average',
  6: 'Above Average',
  7: 'Good',
  8: 'Very Good',
  9: 'Excellent',
  10: 'Masterpiece',
};

export function StarRating({
  rating,
  onRatingChange,
  size = 28,
  readonly = false,
  showLabel = true,
}: StarRatingProps) {
  const handlePress = useCallback(
    (value: number) => {
      onRatingChange?.(value);
    },
    [onRatingChange]
  );

  const styles = useStyles((colors) =>
    StyleSheet.create({
      container: {
        alignItems: 'center',
        gap: Spacing.sm,
      },
      starsRow: {
        flexDirection: 'row',
        gap: Spacing.xxs,
      },
      labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
      },
      ratingNumber: {
        ...Typography.label,
        color: colors.starActive,
        fontFamily: FontFamily.bold,
      },
      ratingLabel: {
        ...Typography.caption,
        color: colors.textSecondary,
        textTransform: 'none',
        letterSpacing: 0,
      },
    })
  );

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {Array.from({ length: 10 }, (_, i) => (
          <Star
            key={i}
            index={i}
            filled={i < rating}
            size={size}
            onPress={handlePress}
            readonly={readonly}
          />
        ))}
      </View>
      {showLabel && rating > 0 && (
        <View style={styles.labelRow}>
          <Text style={styles.ratingNumber}>{rating}/10</Text>
          <Text style={styles.ratingLabel}>
            {RATING_LABELS[rating] || ''}
          </Text>
        </View>
      )}
    </View>
  );
}

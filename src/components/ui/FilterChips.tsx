// ============================================================
// FilterChips — Horizontal scrollable filter chips
// ============================================================

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useStyles } from '../../stores/themeStore';
import { Typography, FontFamily } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FilterChip {
  key: string;
  label: string;
  icon?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string;
  onSelect: (key: string) => void;
}

function Chip({
  chip,
  isSelected,
  onPress,
  styles,
}: {
  chip: FilterChip;
  isSelected: boolean;
  onPress: () => void;
  styles: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.chip,
        isSelected && styles.chipSelected,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          isSelected && styles.chipTextSelected,
        ]}
      >
        {chip.label}
      </Text>
    </AnimatedPressable>
  );
}

export function FilterChips({ chips, selected, onSelect }: FilterChipsProps) {
  const styles = useStyles((colors) =>
    StyleSheet.create({
      scrollContent: {
        paddingHorizontal: Spacing.base,
        gap: Spacing.sm,
      },
      chip: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.glassBorder,
      },
      chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      chipText: {
        fontFamily: FontFamily.medium,
        fontSize: 13,
        color: colors.textSecondary,
      },
      chipTextSelected: {
        color: colors.textPrimary,
      },
    })
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          chip={chip}
          isSelected={selected === chip.key}
          onPress={() => onSelect(chip.key)}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
}

// ============================================================
// SearchBar — Animated search input with glow effect
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles } from '../../stores/themeStore';
import { Typography, FontFamily } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search movies, shows, videos...',
  onFocus,
  onBlur,
  onSubmit,
  style,
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const glowOpacity = useSharedValue(0);
  const { colors } = useTheme();

  const styles = useStyles((c) =>
    StyleSheet.create({
      wrapper: {
        position: 'relative',
      },
      glow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: c.accentStart,
        borderRadius: BorderRadius.lg,
        opacity: 0,
        transform: [{ scale: 1.02 }],
      },
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surfaceElevated,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: c.glassBorder,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
      },
      containerFocused: {
        borderColor: c.accentStart,
      },
      input: {
        flex: 1,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: c.textPrimary,
        padding: 0,
      },
    })
  );

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleFocus = () => {
    setFocused(true);
    glowOpacity.value = withTiming(1, { duration: 200 });
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    glowOpacity.value = withTiming(0, { duration: 200 });
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={[styles.container, focused && styles.containerFocused]}>
        <Ionicons
          name="search"
          size={20}
          color={focused ? colors.accent : colors.textMuted}
        />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

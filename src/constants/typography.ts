// ============================================================
// FriendLens — Typography System
// ============================================================

import { TextStyle } from 'react-native';

// We load Inter via expo-font / Google Fonts
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Typography: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['4xl'],
    letterSpacing: -0.5,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    letterSpacing: -0.5,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize['2xl'],
    letterSpacing: -0.3,
    lineHeight: FontSize['2xl'] * LineHeight.tight,
  },
  h4: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    letterSpacing: -0.2,
    lineHeight: FontSize.xl * LineHeight.tight,
  },

  // Body
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },

  // Labels / Captions
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    letterSpacing: 0.3,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  captionSmall: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: FontSize.xs * LineHeight.normal,
  },

  // Interactive
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    letterSpacing: 0.3,
    lineHeight: FontSize.base * LineHeight.tight,
  },
  buttonSmall: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    letterSpacing: 0.3,
    lineHeight: FontSize.md * LineHeight.tight,
  },
} as const;

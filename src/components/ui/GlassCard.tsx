// ============================================================
// GlassCard — Glassmorphism card component
// ============================================================

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useStyles } from '../../stores/themeStore';
import { BorderRadius, Spacing } from '../../constants/layout';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  noPadding?: boolean;
  onLayout?: (event: any) => void;
}

export function GlassCard({
  children,
  style,
  elevated = false,
  noPadding = false,
  onLayout,
}: GlassCardProps) {
  const styles = useStyles((colors) =>
    StyleSheet.create({
      card: {
        backgroundColor: colors.glassBackground,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        padding: noPadding ? 0 : Spacing.base,
        overflow: 'hidden',
      },
      elevated: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.glassBorderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    })
  );

  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
      onLayout={onLayout}
    >
      {children}
    </View>
  );
}

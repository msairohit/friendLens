// ============================================================
// EmptyState — Empty state placeholder
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles } from '../../stores/themeStore';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = 'albums-outline',
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  const { colors } = useTheme();
  
  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing['4xl'],
        gap: Spacing.md,
      },
      iconContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.xl,
        backgroundColor: c.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
      },
      title: {
        ...Typography.h4,
        color: c.textPrimary,
        textAlign: 'center',
      },
      subtitle: {
        ...Typography.bodySmall,
        color: c.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
      },
      actionContainer: {
        marginTop: Spacing.base,
      },
    })
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

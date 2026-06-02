// ============================================================
// LoadingScreen — Full-screen animated loader
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, useStyles } from '../../stores/themeStore';
import { Typography } from '../../constants/typography';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { colors } = useTheme();
  
  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      },
      message: {
        ...Typography.bodySmall,
        color: c.textSecondary,
      },
    })
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

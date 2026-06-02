import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { GlassCard } from '../../src/components/ui/GlassCard';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
        justifyContent: 'center',
        padding: 20,
      },
      card: {
        padding: 24,
        alignItems: 'center',
      },
      title: {
        color: c.textPrimary,
        textAlign: 'center',
        marginBottom: 5,
      },
      subtitle: {
        color: c.textMuted,
        textAlign: 'center',
        marginBottom: 20,
      },
      text: {
        color: c.textSecondary,
        textAlign: 'center',
      },
    })
  );

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={[Typography.h3, styles.title]}>User Profile</Text>
        <Text style={[Typography.bodySmall, styles.subtitle]}>
          User ID: {id}
        </Text>
        <Text style={[Typography.body, styles.text]}>
          Reviews list and relationship status with this user will be displayed here.
        </Text>
      </GlassCard>
    </View>
  );
}

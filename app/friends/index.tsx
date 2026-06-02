import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { GlassCard } from '../../src/components/ui/GlassCard';

export default function FriendsListScreen() {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={[Typography.h3, styles.title]}>My Connections</Text>
        <Text style={[Typography.body, styles.text]}>
          View all your direct friends, manage requests, and browse recommendations.
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { GlassCard } from '../../src/components/ui/GlassCard';

export default function DiscoverFriendsScreen() {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={[Typography.h3, styles.title]}>Discover Friends</Text>
        <Text style={[Typography.body, styles.text]}>
          Scan your contacts to discover who is already using FriendLens.
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

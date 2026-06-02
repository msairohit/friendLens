import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={[Typography.h2, styles.title]}>Setup Profile</Text>
        <Text style={[Typography.body, styles.subtitle]}>
          Find friends from your contacts and complete your profile.
        </Text>
        <GradientButton
          title="Complete Profile"
          onPress={() => router.replace('/(tabs)')}
          style={styles.button}
        />
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
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    marginVertical: 8,
  },
});

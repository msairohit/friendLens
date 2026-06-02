import React, { useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useAuthStore } from '../../src/stores/authStore';

export default function LoginScreen() {
  const { signIn, loading } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<'user1' | 'user2' | 'user3'>('user1');

  const handleLogin = async (userKey: 'user1' | 'user2' | 'user3') => {
    const email = `${userKey}@friendlens.com`;
    try {
      await signIn(email);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Make sure you ran the seed.sql script in your Supabase SQL Editor.'
      );
    }
  };

  const getUserDescription = (userKey: 'user1' | 'user2' | 'user3') => {
    switch (userKey) {
      case 'user1':
        return 'Sees direct friend user2\'s review of Breaking Bad. Sees user3\'s reviews with pseudonyms (anonymous friend-of-friend).';
      case 'user2':
        return 'Sees direct friends user1 (Inception) and user3 (Apple Vision Pro & Inception) reviews with real names.';
      case 'user3':
        return 'Sees direct friend user2\'s review of Breaking Bad. Sees user1\'s reviews with pseudonyms.';
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={[Typography.h2, styles.title]}>Welcome to FriendLens</Text>
        <Text style={[Typography.body, styles.subtitle]}>
          Discover movies, shows, and videos through your network.
        </Text>

        <Text style={[Typography.caption, styles.sectionTitle]}>SELECT A USER TO LOG IN</Text>

        {(['user1', 'user2', 'user3'] as const).map((u) => {
          const isSelected = selectedUser === u;
          return (
            <TouchableOpacity
              key={u}
              style={[
                styles.userOption,
                isSelected && styles.userOptionSelected
              ]}
              onPress={() => setSelectedUser(u)}
              activeOpacity={0.7}
            >
              <Text style={[Typography.h3, styles.userOptionText, isSelected && styles.userOptionTextSelected]}>
                {u.toUpperCase()}
              </Text>
              <Text style={[Typography.caption, styles.userOptionDesc, isSelected && styles.userOptionDescSelected]}>
                {getUserDescription(u)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.accentStart} style={styles.loader} />
        ) : (
          <GradientButton
            title={`Log In as ${selectedUser.toUpperCase()}`}
            onPress={() => handleLogin(selectedUser)}
            style={styles.button}
          />
        )}
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
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  userOption: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
  },
  userOptionSelected: {
    borderColor: Colors.accentStart,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  userOptionText: {
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userOptionTextSelected: {
    color: Colors.textPrimary,
  },
  userOptionDesc: {
    color: Colors.textMuted,
    lineHeight: 16,
  },
  userOptionDescSelected: {
    color: Colors.textSecondary,
  },
  button: {
    width: '100%',
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
});


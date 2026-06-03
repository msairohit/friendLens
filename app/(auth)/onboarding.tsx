import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDisplayName(user.displayName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!username.trim()) {
      Alert.alert('Validation Error', 'Please enter a username.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(cleanUsername)) {
      Alert.alert(
        'Validation Error',
        'Username must be between 3 and 15 characters, containing only letters, numbers, and underscores.'
      );
      return;
    }

    setLoading(true);
    try {
      const { repositories } = require('../../src/repositories');
      const updatedProfile = await repositories.auth.updateProfile(user.id, {
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        phone: phone.trim() || undefined,
      });

      setUser(updatedProfile);
      Alert.alert('Success', 'Profile setup complete!', [
        { text: 'Let\'s Go', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile. Username might be taken.');
    } finally {
      setLoading(false);
    }
  };

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.md,
      },
      card: {
        padding: 24,
        width: '100%',
        alignItems: 'stretch',
      },
      title: {
        color: c.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
      },
      subtitle: {
        color: c.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
      },
      label: {
        color: c.textPrimary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
        fontSize: 14,
        fontWeight: '600',
      },
      inputContainer: {
        backgroundColor: c.surfaceElevated,
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        height: 48,
        marginBottom: Spacing.md,
        justifyContent: 'center',
      },
      input: {
        color: c.textPrimary,
        fontSize: 15,
        height: '100%',
      },
      button: {
        marginTop: Spacing.md,
        width: '100%',
      },
      loader: {
        marginVertical: 20,
      },
    })
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <GlassCard style={styles.card}>
          <Text style={[Typography.h2, styles.title]}>Setup Profile</Text>
          <Text style={[Typography.body, styles.subtitle]}>
            Complete your profile details to connect with friends.
          </Text>

          <Text style={styles.label}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Pick a unique username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Display Name (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="What should we call you?"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +1234567890"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accentStart} style={styles.loader} />
          ) : (
            <GradientButton
              title="Complete Profile"
              onPress={handleSaveProfile}
              style={styles.button}
            />
          )}
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


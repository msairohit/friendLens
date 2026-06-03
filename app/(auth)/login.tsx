import React, { useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useAuthStore } from '../../src/stores/authStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signIn, loading } = useAuthStore();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<'user1' | 'user2' | 'user3'>('user1');

  const handleRealLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    try {
      // Custom sign-in with full credentials
      const { repositories } = require('../../src/repositories');
      const { setUser } = useAuthStore.getState();
      useAuthStore.setState({ loading: true });
      const { user, error } = await repositories.auth.signIn(email.trim().toLowerCase(), password);
      if (error) {
        useAuthStore.setState({ loading: false });
        throw new Error(error);
      }
      setUser(user);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Check your credentials and try again.'
      );
    }
  };

  const handleMockLogin = async (userKey: 'user1' | 'user2' | 'user3') => {
    const mockEmail = `${userKey}@friendlens.com`;
    try {
      await signIn(mockEmail);
    } catch (error: any) {
      Alert.alert(
        'Mock Login Failed',
        error.message || 'Make sure you ran the seed.sql script in your Supabase SQL Editor.'
      );
    }
  };

  const getUserDescription = (userKey: 'user1' | 'user2' | 'user3') => {
    switch (userKey) {
      case 'user1':
        return "Direct friend with User2. Sees User3's reviews anonymously.";
      case 'user2':
        return 'Direct friend with User1 and User3. Sees their reviews with real names.';
      case 'user3':
        return "Direct friend with User2. Sees User1's reviews anonymously.";
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surfaceElevated,
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        height: 48,
        marginBottom: Spacing.md,
      },
      input: {
        flex: 1,
        color: c.textPrimary,
        fontSize: 15,
        height: '100%',
      },
      passwordToggle: {
        padding: Spacing.xs,
      },
      button: {
        marginTop: Spacing.sm,
        width: '100%',
      },
      registerLink: {
        marginTop: Spacing.md,
        alignItems: 'center',
      },
      registerText: {
        color: c.textSecondary,
        fontSize: 14,
      },
      registerTextBold: {
        color: c.primary,
        fontWeight: 'bold',
      },
      dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.lg,
      },
      dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: c.divider,
      },
      dividerText: {
        color: c.textMuted,
        paddingHorizontal: Spacing.sm,
        fontSize: 12,
        fontWeight: '600',
      },
      quickLoginHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xs,
      },
      quickLoginTitle: {
        color: c.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
      },
      quickLoginContainer: {
        marginTop: Spacing.sm,
      },
      userOption: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: c.glassBorder,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginVertical: 4,
      },
      userOptionSelected: {
        borderColor: c.accentStart,
        backgroundColor: 'rgba(0, 210, 255, 0.08)',
      },
      userOptionText: {
        color: c.textSecondary,
        marginBottom: 2,
        fontWeight: '600',
      },
      userOptionTextSelected: {
        color: c.textPrimary,
      },
      userOptionDesc: {
        color: c.textMuted,
        fontSize: 11,
      },
      userOptionDescSelected: {
        color: c.textSecondary,
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
          <Text style={[Typography.h2, styles.title]}>Welcome to FriendLens</Text>
          <Text style={[Typography.body, styles.subtitle]}>
            Discover movies, shows, and videos through your network.
          </Text>

          {/* Real Login Form */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. user@friendlens.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accentStart} style={styles.loader} />
          ) : (
            <GradientButton
              title="Log In"
              onPress={handleRealLogin}
              style={styles.button}
            />
          )}

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          {/* Developer Quick / Mock Login Options */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEVELOPER OPTION</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.quickLoginHeader}
            onPress={() => setShowQuickLogin(!showQuickLogin)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showQuickLogin ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.quickLoginTitle}>Quick Login with Seed Accounts</Text>
          </TouchableOpacity>

          {showQuickLogin && (
            <View style={styles.quickLoginContainer}>
              {([ 'user1', 'user2', 'user3' ] as const).map((u) => {
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
                    <Text style={[Typography.body, styles.userOptionText, isSelected && styles.userOptionTextSelected]}>
                      {u.toUpperCase()}
                    </Text>
                    <Text style={styles.userOptionDesc}>
                      {getUserDescription(u)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {!loading && (
                <GradientButton
                  title={`Quick Log In as ${selectedUser.toUpperCase()}`}
                  onPress={() => handleMockLogin(selectedUser)}
                  variant="outline"
                  style={[styles.button, { marginTop: Spacing.sm }]}
                />
              )}
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



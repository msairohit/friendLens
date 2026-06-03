import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { repositories } = require('../../src/repositories');
      const { setUser } = useAuthStore.getState();
      
      const { user, error } = await repositories.auth.signUp(email.trim().toLowerCase(), password);
      
      if (error) {
        throw new Error(error);
      }
      
      Alert.alert(
        'Account Created',
        'Your account has been created successfully!',
        [{ text: 'Continue', onPress: () => setUser(user) }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Could not register account. Please try again.');
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
        marginTop: Spacing.md,
        width: '100%',
      },
      loginLink: {
        marginTop: Spacing.md,
        alignItems: 'center',
      },
      loginText: {
        color: c.textSecondary,
        fontSize: 14,
      },
      loginTextBold: {
        color: c.primary,
        fontWeight: 'bold',
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
          <Text style={[Typography.h2, styles.title]}>Create Account</Text>
          <Text style={[Typography.body, styles.subtitle]}>
            Join the network and start reviewing your favorite contents.
          </Text>

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
              placeholder="Create a password"
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

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accentStart} style={styles.loader} />
          ) : (
            <GradientButton
              title="Sign Up"
              onPress={handleSignUp}
              style={styles.button}
            />
          )}

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


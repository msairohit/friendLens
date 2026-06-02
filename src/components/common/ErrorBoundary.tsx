// ============================================================
// ErrorBoundary — Error handling wrapper
// ============================================================

import React, { Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const colors = Colors;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.error}1A` }]}>
            <Ionicons
              name="warning-outline"
              size={48}
              color={colors.error}
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Something went wrong</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.surfaceElevated }]} onPress={this.handleRetry}>
            <Ionicons name="refresh" size={18} color={colors.textPrimary} />
            <Text style={[styles.retryText, { color: colors.textPrimary }]}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h4,
  },
  message: {
    ...Typography.bodySmall,
    textAlign: 'center',
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.base,
  },
  retryText: {
    ...Typography.button,
  },
});

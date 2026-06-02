// ============================================================
// GradientButton — Gradient-styled pressable button
// ============================================================

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useStyles } from '../../stores/themeStore';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const { colors, gradients } = useTheme();

  const styles = useStyles((c) =>
    StyleSheet.create({
      gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
      },
      outline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: c.primary,
        gap: Spacing.sm,
      },
      sizeSm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
        minHeight: 36,
      },
      sizeMd: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        minHeight: 48,
      },
      sizeLg: {
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing['2xl'],
        minHeight: 56,
      },
      text: {
        ...Typography.button,
        color: c.textPrimary,
      },
      textSm: {
        fontSize: 13,
      },
      textMd: {
        fontSize: 15,
      },
      textLg: {
        fontSize: 17,
      },
      outlineText: {
        ...Typography.button,
        color: c.primary,
      },
      disabled: {
        opacity: 0.5,
      },
    })
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const sizeStyles = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  };

  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
  };

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, styles.outline, sizeStyles[size], disabled && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            {icon}
            <Text style={[styles.outlineText, textSizeStyles[size]]}>
              {title}
            </Text>
          </>
        )}
      </AnimatedPressable>
    );
  }

  const gradientColors = variant === 'accent' ? gradients.accent : gradients.primary;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, sizeStyles[size]]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, textSizeStyles[size]]}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

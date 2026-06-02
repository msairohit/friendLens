// ============================================================
// Avatar — User avatar component with optional status indicator
// ============================================================

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme, useStyles } from '../../stores/themeStore';
import { AvatarSize, BorderRadius } from '../../constants/layout';
import { FontFamily } from '../../constants/typography';
import { Ionicons } from '@expo/vector-icons';

type AvatarSizeKey = keyof typeof AvatarSize;

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSizeKey;
  isAnonymous?: boolean;
  showOnline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  uri,
  name,
  size = 'md',
  isAnonymous = false,
  showOnline = false,
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const dimension = AvatarSize[size];
  const fontSize = dimension * 0.4;
  const statusSize = dimension * 0.25;

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        position: 'relative',
      },
      image: {
        backgroundColor: c.surfaceElevated,
      },
      fallback: {
        backgroundColor: c.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: c.glassBorder,
      },
      anonymousBg: {
        backgroundColor: c.graphNodeAnonymous,
        borderColor: c.textMuted,
      },
      initials: {
        fontFamily: FontFamily.semiBold,
        color: c.textSecondary,
      },
      status: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: c.success,
        borderColor: c.background,
      },
    })
  );

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {isAnonymous ? (
        <View style={[styles.fallback, containerStyle, styles.anonymousBg]}>
          <Ionicons
            name="help-outline"
            size={fontSize * 1.2}
            color={colors.textMuted}
          />
        </View>
      ) : uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, containerStyle]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            styles.status,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              borderWidth: statusSize * 0.2,
            },
          ]}
        />
      )}
    </View>
  );
}

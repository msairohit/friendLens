import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/stores/themeStore';
import { FontFamily } from '../../src/constants/typography';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useNotificationStore } from '../../src/stores/notificationStore';

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { unreadCount } = useNotificationStore();

  const styles = StyleSheet.create({
    bellContainer: {
      marginRight: 16,
      position: 'relative',
      padding: 4,
    },
    badge: {
      position: 'absolute',
      right: 0,
      top: 0,
      backgroundColor: colors.accentStart,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.glassBorder,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: FontFamily.bold,
          color: colors.textPrimary,
          fontSize: 18,
        },
        tabBarActiveTintColor: colors.accentStart,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.glassBorder,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.bellContainer}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.textPrimary}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-review"
        options={{
          title: 'Add Review',
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarLabel: 'Network',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'git-network' : 'git-network-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

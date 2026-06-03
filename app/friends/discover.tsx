import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles } from '../../src/stores/themeStore';
import { Typography, FontFamily } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/layout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuthStore } from '../../src/stores/authStore';
import { repositories } from '../../src/repositories';
import { Profile, Connection } from '../../src/types';
import {
  requestContactsPermission,
  checkContactsPermission,
  getContactPhonesWithNames,
  normalizePhoneNumber,
  ContactPhoneInfo,
} from '../../src/lib/contactsHelper';

interface ContactResult {
  profile: Profile;
  connection: Connection | null;
  actionLoading: boolean;
  contactName?: string;
}

export default function DiscoverFriendsScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ContactResult[]>([]);
  const [scanned, setScanned] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const styles = useStyles((c) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.background,
      },
      scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
      },
      infoCard: {
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        alignItems: 'center',
      },
      infoIcon: {
        marginBottom: Spacing.md,
      },
      infoTitle: {
        color: c.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.xs,
      },
      infoSubtitle: {
        color: c.textSecondary,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
      },
      scanButton: {
        marginTop: Spacing.lg,
        width: '100%',
      },
      phonePrompt: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
      },
      phonePromptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
      },
      phonePromptTitle: {
        color: c.accentStart,
        fontSize: 14,
        fontWeight: '600',
      },
      phonePromptText: {
        color: c.textSecondary,
        fontSize: 13,
        marginBottom: Spacing.md,
        lineHeight: 18,
      },
      phoneInputRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        alignItems: 'center',
      },
      phoneTextInput: {
        flex: 1,
        backgroundColor: c.surfaceElevated,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: c.glassBorder,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        color: c.textPrimary,
        fontFamily: FontFamily.regular,
        fontSize: 15,
      },
      phoneCurrentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
      },
      phoneCurrentText: {
        color: c.success,
        fontSize: 13,
        fontWeight: '600',
      },
      resultCard: {
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
      },
      resultInfo: {
        flex: 1,
        marginLeft: Spacing.md,
      },
      resultName: {
        color: c.textPrimary,
        fontSize: 16,
        fontWeight: '600',
      },
      resultUsername: {
        color: c.textSecondary,
        fontSize: 13,
      },
      resultTag: {
        color: c.textMuted,
        fontSize: 11,
        marginTop: 1,
      },
      actionContainer: {
        marginLeft: Spacing.sm,
      },
      statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
      },
      requestedBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: c.textMuted,
      },
      friendsBadge: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        borderWidth: 1,
        borderColor: c.success,
      },
      requestedText: {
        color: c.textMuted,
        fontSize: 12,
        fontWeight: '600',
      },
      friendsText: {
        color: c.success,
        fontSize: 12,
        fontWeight: '600',
      },
      sectionTitle: {
        color: c.textMuted,
        letterSpacing: 1.5,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
      },
      emptyIcon: {
        marginBottom: Spacing.md,
        opacity: 0.3,
      },
      emptyText: {
        color: c.textMuted,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
      },
      loadingContainer: {
        alignItems: 'center',
        paddingVertical: Spacing['2xl'],
      },
      loadingText: {
        color: c.textSecondary,
        marginTop: Spacing.sm,
        fontSize: 13,
      },
      countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.pill,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginLeft: Spacing.sm,
      },
      countText: {
        color: c.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
      },
    })
  );

  const handleRequestPermission = async () => {
    const granted = await requestContactsPermission();
    setHasPermission(granted);
    if (!granted) {
      Alert.alert(
        'Permission Needed',
        'FriendLens needs access to your contacts to find friends who are already using the app. You can enable this in Settings.',
      );
    }
  };

  const handleScanContacts = async () => {
    if (!user) return;

    // Check/request permission first
    let permGranted = hasPermission;
    if (permGranted === null) {
      permGranted = await checkContactsPermission();
      if (!permGranted) {
        permGranted = await requestContactsPermission();
      }
      setHasPermission(permGranted);
    }

    if (!permGranted) {
      Alert.alert(
        'Permission Needed',
        'Please grant contacts permission to discover friends.',
      );
      return;
    }

    setScanning(true);
    setResults([]);
    try {
      const contactList = await getContactPhonesWithNames();
      const phones = contactList.map((c) => c.number);

      if (phones.length === 0) {
        setScanned(true);
        setScanning(false);
        return;
      }

      const matchedProfiles = await repositories.connections.findUsersFromContacts(phones);

      // Exclude current user from results
      const filtered = matchedProfiles.filter((p) => p.id !== user.id);

      // Build a map of last 10 digits -> Contact Name
      const phoneToNameMap = new Map<string, string>();
      for (const c of contactList) {
        const clean = c.number.replace(/[^\d]/g, '');
        const last10 = clean.length >= 10 ? clean.slice(-10) : clean;
        phoneToNameMap.set(last10, c.name);
      }

      // Fetch connection status for each
      const withStatus: ContactResult[] = await Promise.all(
        filtered.map(async (profile) => {
          const connection = await repositories.connections.getConnectionBetween(
            user.id,
            profile.id
          );

          let contactName: string | undefined;
          if (profile.phone) {
            const profileClean = profile.phone.replace(/[^\d]/g, '');
            const profileLast10 = profileClean.length >= 10 ? profileClean.slice(-10) : profileClean;
            contactName = phoneToNameMap.get(profileLast10);
          }

          return { profile, connection, actionLoading: false, contactName };
        })
      );

      setResults(withStatus);
      setScanned(true);
    } catch (e) {
      console.error('Contact scan error:', e);
      Alert.alert('Error', 'Failed to scan contacts. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSavePhone = async () => {
    if (!user || !phoneInput.trim()) return;

    setSavingPhone(true);
    try {
      const normalized = normalizePhoneNumber(phoneInput.trim());
      await repositories.auth.updateProfile(user.id, { phone: normalized } as any);
      setShowPhoneInput(false);
      setPhoneInput('');
      Alert.alert('Saved!', 'Your phone number has been added. Friends can now discover you from their contacts.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSendRequest = async (index: number) => {
    if (!user) return;
    const result = results[index];

    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, actionLoading: true } : r))
    );

    try {
      const connection = await repositories.connections.sendRequest(
        user.id,
        result.profile.id
      );
      setResults((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, connection, actionLoading: false } : r
        )
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send request');
      setResults((prev) =>
        prev.map((r, i) => (i === index ? { ...r, actionLoading: false } : r))
      );
    }
  };

  const handleAcceptRequest = async (index: number) => {
    const result = results[index];
    if (!result.connection) return;

    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, actionLoading: true } : r))
    );

    try {
      const updated = await repositories.connections.acceptRequest(result.connection.id);
      setResults((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, connection: updated, actionLoading: false } : r
        )
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept');
      setResults((prev) =>
        prev.map((r, i) => (i === index ? { ...r, actionLoading: false } : r))
      );
    }
  };

  const renderAction = (result: ContactResult, index: number) => {
    if (result.actionLoading) {
      return (
        <View style={styles.actionContainer}>
          <ActivityIndicator size="small" color={colors.accentStart} />
        </View>
      );
    }

    const { connection } = result;

    if (!connection) {
      return (
        <View style={styles.actionContainer}>
          <GradientButton
            title="Add"
            onPress={() => handleSendRequest(index)}
            size="sm"
            icon={<Ionicons name="person-add-outline" size={14} color={colors.textPrimary} />}
          />
        </View>
      );
    }

    if (connection.status === 'accepted') {
      return (
        <View style={styles.actionContainer}>
          <View style={[styles.statusBadge, styles.friendsBadge]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.friendsText}>Friends</Text>
          </View>
        </View>
      );
    }

    if (connection.status === 'pending') {
      if (user && connection.requesterId === user.id) {
        return (
          <View style={styles.actionContainer}>
            <View style={[styles.statusBadge, styles.requestedBadge]}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.requestedText}>Requested</Text>
            </View>
          </View>
        );
      } else {
        return (
          <View style={styles.actionContainer}>
            <GradientButton
              title="Accept"
              onPress={() => handleAcceptRequest(index)}
              size="sm"
              variant="accent"
            />
          </View>
        );
      }
    }

    return null;
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <GlassCard style={styles.infoCard}>
          <Ionicons
            name="people-circle-outline"
            size={48}
            color={colors.accentStart}
            style={styles.infoIcon}
          />
          <Text style={[Typography.h4, styles.infoTitle]}>Discover Friends</Text>
          <Text style={styles.infoSubtitle}>
            Scan your phone contacts to find people who are already on FriendLens.
          </Text>
          <GradientButton
            title={scanning ? 'Scanning...' : 'Scan Contacts'}
            onPress={handleScanContacts}
            loading={scanning}
            disabled={scanning}
            style={styles.scanButton}
            icon={<Ionicons name="scan-outline" size={18} color={colors.textPrimary} />}
          />
        </GlassCard>

        {/* Add Your Phone Prompt */}
        {!user.phone && (
          <GlassCard style={styles.phonePrompt}>
            <View style={styles.phonePromptHeader}>
              <Ionicons name="call-outline" size={18} color={colors.accentStart} />
              <Text style={styles.phonePromptTitle}>Be Discoverable</Text>
            </View>
            <Text style={styles.phonePromptText}>
              Add your phone number so friends can find you when they scan their contacts.
            </Text>
            {showPhoneInput ? (
              <View style={styles.phoneInputRow}>
                <TextInput
                  style={styles.phoneTextInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="+1 555 123 4567"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <GradientButton
                  title="Save"
                  onPress={handleSavePhone}
                  size="sm"
                  loading={savingPhone}
                  disabled={!phoneInput.trim() || savingPhone}
                />
              </View>
            ) : (
              <GradientButton
                title="Add Phone Number"
                onPress={() => setShowPhoneInput(true)}
                variant="outline"
                size="sm"
              />
            )}
          </GlassCard>
        )}

        {user.phone && (
          <View style={styles.phoneCurrentBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.phoneCurrentText}>
              Phone added — friends can discover you
            </Text>
          </View>
        )}

        {/* Scanning State */}
        {scanning && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accentStart} />
            <Text style={styles.loadingText}>Scanning your contacts...</Text>
          </View>
        )}

        {/* Results */}
        {!scanning && scanned && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[Typography.caption, styles.sectionTitle]}>
                FOUND ON FRIENDLENS
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{results.length}</Text>
              </View>
            </View>

            {results.length > 0 ? (
              results.map((result, index) => (
                <GlassCard key={result.profile.id} style={styles.resultCard}>
                  <Avatar
                    name={result.profile.displayName || result.profile.username}
                    uri={result.profile.avatarUrl}
                    size="md"
                  />
                  <View style={styles.resultInfo}>
                    <Text style={[Typography.bodyBold, styles.resultName]}>
                      {result.profile.displayName || result.profile.username}
                    </Text>
                    {result.contactName && (
                      <Text style={[Typography.caption, { color: colors.accentStart, marginTop: 1, marginBottom: 2 }]}>
                        Saved in contacts: {result.contactName}
                      </Text>
                    )}
                    <Text style={styles.resultUsername}>@{result.profile.username}</Text>
                    <Text style={styles.resultTag}>{result.profile.friendTag}</Text>
                  </View>
                  {renderAction(result, index)}
                </GlassCard>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={colors.textMuted}
                  style={styles.emptyIcon}
                />
                <Text style={[Typography.body, styles.emptyText]}>
                  None of your contacts are on FriendLens yet.{'\n'}
                  Invite them to join!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

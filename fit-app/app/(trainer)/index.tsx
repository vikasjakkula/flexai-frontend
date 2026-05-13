import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Users, Dumbbell, MessageCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, type UserProfileData } from '@/lib/api';

const RECENT_ACTIVITY = [
  { id: '1', text: 'You sent a plan to Alex M.', time: '2h ago' },
  { id: '2', text: 'You sent a plan to Jordan T.', time: '5h ago' },
  { id: '3', text: 'You sent a plan to Casey L.', time: '1d ago' },
  { id: '4', text: 'You sent a plan to Morgan R.', time: '2d ago' },
];

export default function TrainerDashboard() {
  const { profile } = useUserProfile();
  const { user, signOutApp } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansSent] = useState(14);
  const [messagesCount] = useState(7);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const all = await getAllUsers();
      setClients(all.filter((u) => u.role === 'user'));
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  const handleSignOut = async () => {
    await signOutApp();
  };

  const handleAssign = (userId: string) => {
    router.push({ pathname: '/(trainer)/assign', params: { userId } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trainer Dashboard</Text>
        <Text style={styles.trainerName}>{profile?.name || 'Trainer'}</Text>
        <Text style={styles.trainerEmail}>Signed in as {user?.email ?? profile?.email ?? ''}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Users size={22} color={T.primary} />
          <Text style={styles.statNumber}>{loading ? '—' : clients.length}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Dumbbell size={22} color={T.accent} />
          <Text style={[styles.statNumber, { color: T.accent }]}>{plansSent}</Text>
          <Text style={styles.statLabel}>Plans Sent</Text>
        </View>
        <View style={styles.statCard}>
          <MessageCircle size={22} color={T.warning} />
          <Text style={[styles.statNumber, { color: T.warning }]}>{messagesCount}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      {/* Awaiting Plans Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Awaiting Plans</Text>
        {loading ? (
          <ActivityIndicator color={T.primary} style={{ marginTop: T.spacing.md }} />
        ) : clients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clients yet</Text>
          </View>
        ) : (
          clients.map((client) => (
            <View key={client.uid} style={styles.clientCard}>
              <View style={styles.clientInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(client.name || client.email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>{client.name || 'Unnamed'}</Text>
                  <Text style={styles.clientEmail} numberOfLines={1}>
                    {client.email}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => handleAssign(client.uid)}
              >
                <Text style={styles.assignButtonText}>Assign Plan</Text>
                <ChevronRight size={14} color={T.white ?? '#ffffff'} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {RECENT_ACTIVITY.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                index < RECENT_ACTIVITY.length - 1 && styles.activityRowBorder,
              ]}
            >
              <View style={styles.activityBullet} />
              <Text style={styles.activityText} numberOfLines={1}>
                {item.text}
              </Text>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={18} color={T.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  content: {
    paddingBottom: T.spacing.xxl,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.lg,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: {
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
    color: T.text,
    marginBottom: T.spacing.xs,
  },
  trainerName: {
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    color: T.primary,
    marginBottom: 2,
  },
  trainerEmail: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    alignItems: 'center',
    paddingVertical: T.spacing.md,
    gap: T.spacing.xs,
    borderWidth: 1,
    borderColor: T.border,
  },
  statNumber: {
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
    color: T.primary,
  },
  statLabel: {
    fontSize: T.fontSize.xs,
    color: T.textMuted,
    fontWeight: T.fontWeight.medium,
  },
  section: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    paddingBottom: T.spacing.sm,
  },
  sectionTitle: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
    marginBottom: T.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: T.spacing.lg,
  },
  emptyText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
  },
  clientCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: T.spacing.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.spacing.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
  },
  clientEmail: {
    fontSize: T.fontSize.xs,
    color: T.textMuted,
    marginTop: 2,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primary,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.radius.md,
    gap: 4,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.semibold,
  },
  activityCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    gap: T.spacing.sm,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  activityBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.primary,
    flexShrink: 0,
  },
  activityText: {
    flex: 1,
    fontSize: T.fontSize.sm,
    color: T.textMuted,
  },
  activityTime: {
    fontSize: T.fontSize.xs,
    color: T.textDim,
    flexShrink: 0,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.lg,
    paddingVertical: T.spacing.md,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.error,
  },
  signOutText: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    color: T.error,
  },
});

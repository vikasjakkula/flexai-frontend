import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Search, Users, MessageCircle, Dumbbell } from 'lucide-react-native';
import { T } from '@/constants/theme';
import { getAllUsers, type UserProfileData } from '@/lib/api';

export default function ClientsScreen() {
  const router = useRouter();
  const [allClients, setAllClients] = useState<UserProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const all = await getAllUsers();
      setAllClients(all.filter((u) => u.role === 'user'));
    } catch {
      setAllClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  const filteredClients = allClients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleChat = (client: UserProfileData) => {
    router.push({ pathname: '/(trainer)/chat', params: { clientId: client.uid } });
  };

  const handleAssign = (client: UserProfileData) => {
    router.push({ pathname: '/(trainer)/assign', params: { userId: client.uid } });
  };

  const renderClient = ({ item }: { item: UserProfileData }) => (
    <View style={styles.clientCard}>
      <View style={styles.cardTop}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(item.name || item.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name || 'Unnamed'}</Text>
          <Text style={styles.clientEmail} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{item.role?.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.chatButton} onPress={() => handleChat(item)}>
          <MessageCircle size={14} color={T.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignButton} onPress={() => handleAssign(item)}>
          <Dumbbell size={14} color="#ffffff" />
          <Text style={styles.assignButtonText}>Assign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Users size={48} color={T.textDim} />
      <Text style={styles.emptyTitle}>No clients yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'No clients match your search.' : 'Clients will appear here once they sign up.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <Text style={styles.headerSubtitle}>
          {allClients.length} {allClients.length === 1 ? 'client' : 'clients'} total
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={T.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={T.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Client List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.uid}
          renderItem={renderClient}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredClients.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadClients(true)}
              tintColor={T.primary}
              colors={[T.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.md,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: {
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
    color: T.text,
  },
  headerSubtitle: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
    borderRadius: T.radius.lg,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
    gap: T.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: T.fontSize.md,
    color: T.text,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.xxl,
    gap: T.spacing.sm,
  },
  listContentEmpty: {
    flex: 1,
  },
  clientCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: T.spacing.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.bold,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    marginBottom: T.spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: T.border,
    borderRadius: T.radius.sm,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.bold,
    color: T.textDim,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: T.spacing.sm,
    borderRadius: T.radius.md,
    borderWidth: 1.5,
    borderColor: T.primary,
  },
  chatButtonText: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
    color: T.primary,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.xs,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: T.spacing.sm,
    borderRadius: T.radius.md,
    backgroundColor: T.primary,
  },
  assignButtonText: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: T.spacing.xl,
    gap: T.spacing.md,
  },
  emptyTitle: {
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

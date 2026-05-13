import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Search, Check, Users, Dumbbell, ChevronDown, X } from 'lucide-react-native';
import { T } from '@/constants/theme';
import {
  getAllUsers,
  searchExercises,
  fetchDiets,
  postAssignment,
  type UserProfileData,
} from '@/lib/api';
import type { ExerciseSearchHit, DietItem } from '@/types/catalog';

type Status = { type: 'idle' | 'loading' | 'success' | 'error'; message: string };

export default function AssignScreen() {
  const params = useLocalSearchParams<{ userId?: string }>();

  // Clients
  const [clients, setClients] = useState<UserProfileData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(params.userId ?? '');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [manualUid, setManualUid] = useState('');

  // Exercises
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState<ExerciseSearchHit[]>([]);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, ExerciseSearchHit>>({});

  // Diets
  const [dietQuery, setDietQuery] = useState('');
  const [dietResults, setDietResults] = useState<DietItem[]>([]);
  const [dietLoading, setDietLoading] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState<Record<string, DietItem>>({});

  // Status
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });

  const exerciseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dietDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load clients
  useEffect(() => {
    (async () => {
      try {
        const all = await getAllUsers();
        setClients(all.filter((u) => u.role === 'user'));
      } catch {
        setClients([]);
      }
    })();
  }, []);

  // Seed selected client from params
  useEffect(() => {
    if (params.userId) setSelectedClientId(params.userId);
  }, [params.userId]);

  // Initial exercise load
  useEffect(() => {
    loadExercises('');
    loadDiets('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExercises = useCallback(async (q: string) => {
    setExerciseLoading(true);
    try {
      const results = await searchExercises(q);
      setExerciseResults(results);
    } catch {
      setExerciseResults([]);
    } finally {
      setExerciseLoading(false);
    }
  }, []);

  const loadDiets = useCallback(async (q: string) => {
    setDietLoading(true);
    try {
      const results = await fetchDiets(q);
      setDietResults(results);
    } catch {
      setDietResults([]);
    } finally {
      setDietLoading(false);
    }
  }, []);

  const handleExerciseQueryChange = (text: string) => {
    setExerciseQuery(text);
    if (exerciseDebounceRef.current) clearTimeout(exerciseDebounceRef.current);
    exerciseDebounceRef.current = setTimeout(() => {
      loadExercises(text);
    }, 300);
  };

  const handleDietQueryChange = (text: string) => {
    setDietQuery(text);
    if (dietDebounceRef.current) clearTimeout(dietDebounceRef.current);
    dietDebounceRef.current = setTimeout(() => {
      loadDiets(text);
    }, 300);
  };

  const toggleExercise = (ex: ExerciseSearchHit) => {
    setSelectedExercises((prev) => {
      const next = { ...prev };
      if (next[ex.id]) {
        delete next[ex.id];
      } else {
        next[ex.id] = ex;
      }
      return next;
    });
  };

  const toggleDiet = (diet: DietItem) => {
    setSelectedDiets((prev) => {
      const next = { ...prev };
      if (next[diet.id]) {
        delete next[diet.id];
      } else {
        next[diet.id] = diet;
      }
      return next;
    });
  };

  const resolvedClientId = selectedClientId || manualUid;

  const handleSendPlan = async () => {
    if (!resolvedClientId) {
      setStatus({ type: 'error', message: 'Please select a client first.' });
      return;
    }
    const exCount = Object.keys(selectedExercises).length;
    const dietCount = Object.keys(selectedDiets).length;
    if (exCount === 0 && dietCount === 0) {
      setStatus({ type: 'error', message: 'Please select at least one exercise or diet.' });
      return;
    }
    setStatus({ type: 'loading', message: 'Sending plan...' });
    try {
      await postAssignment({
        targetUserId: resolvedClientId,
        exercises: Object.values(selectedExercises).map((e) => ({
          id: e.id,
          name: e.name,
          typeName: e.typeName,
          muscleGroupName: e.muscleGroupName,
        })),
        diets: Object.values(selectedDiets).map((d) => ({
          id: d.id,
          name: d.name,
        })),
      });
      setStatus({ type: 'success', message: 'Plan sent successfully!' });
      setSelectedExercises({});
      setSelectedDiets({});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send plan.';
      setStatus({ type: 'error', message: msg });
    }
  };

  const selectedClient = clients.find((c) => c.uid === selectedClientId);
  const exCount = Object.keys(selectedExercises).length;
  const dietCount = Object.keys(selectedDiets).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Section 1: Select Client */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assign to Client</Text>

        {/* Dropdown trigger */}
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setShowClientDropdown((v) => !v)}
          activeOpacity={0.8}
        >
          <Users size={18} color={T.textDim} />
          <Text style={[styles.dropdownTriggerText, selectedClient && styles.dropdownSelectedText]}>
            {selectedClient ? selectedClient.name || selectedClient.email : 'Select a client...'}
          </Text>
          <ChevronDown size={18} color={T.textDim} />
        </TouchableOpacity>

        {showClientDropdown && (
          <View style={styles.dropdown}>
            {clients.length === 0 ? (
              <Text style={styles.dropdownEmpty}>No clients found</Text>
            ) : (
              clients.map((c) => (
                <TouchableOpacity
                  key={c.uid}
                  style={[styles.dropdownItem, c.uid === selectedClientId && styles.dropdownItemSelected]}
                  onPress={() => {
                    setSelectedClientId(c.uid);
                    setShowClientDropdown(false);
                  }}
                >
                  <View style={styles.dropdownAvatar}>
                    <Text style={styles.dropdownAvatarText}>
                      {(c.name || c.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.dropdownItemInfo}>
                    <Text style={styles.dropdownItemName}>{c.name || 'Unnamed'}</Text>
                    <Text style={styles.dropdownItemEmail}>{c.email}</Text>
                  </View>
                  {c.uid === selectedClientId && <Check size={16} color={T.primary} />}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Selected client preview */}
        {selectedClient && (
          <View style={styles.selectedClientCard}>
            <View style={styles.selectedAvatar}>
              <Text style={styles.selectedAvatarText}>
                {(selectedClient.name || selectedClient.email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.selectedClientInfo}>
              <Text style={styles.selectedClientName}>{selectedClient.name || 'Unnamed'}</Text>
              <Text style={styles.selectedClientEmail}>{selectedClient.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedClientId('')}>
              <X size={18} color={T.textDim} />
            </TouchableOpacity>
          </View>
        )}

        {/* Manual UID fallback */}
        <Text style={styles.orDivider}>— or enter UID manually —</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter user UID..."
          placeholderTextColor={T.textDim}
          value={manualUid}
          onChangeText={setManualUid}
          autoCapitalize="none"
        />
      </View>

      {/* Section 2: Select Exercises */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Select Exercises</Text>
          {exCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{exCount} selected</Text>
            </View>
          )}
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color={T.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={T.textDim}
            value={exerciseQuery}
            onChangeText={handleExerciseQueryChange}
          />
        </View>

        {exerciseLoading ? (
          <ActivityIndicator color={T.primary} style={styles.loader} />
        ) : exerciseResults.length === 0 ? (
          <Text style={styles.emptyText}>No exercises found.</Text>
        ) : (
          <View style={styles.chipGrid}>
            {exerciseResults.map((ex) => {
              const isSelected = !!selectedExercises[ex.id];
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleExercise(ex)}
                  activeOpacity={0.75}
                >
                  {isSelected && <Check size={13} color="#ffffff" />}
                  <View style={styles.chipContent}>
                    <Text style={[styles.chipName, isSelected && styles.chipNameSelected]}>
                      {ex.name}
                    </Text>
                    <Text style={styles.chipMeta}>
                      {ex.muscleGroupName} · {ex.typeName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Section 3: Select Diets */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Select Diets</Text>
          {dietCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: T.accentLight + '33' }]}>
              <Text style={[styles.countBadgeText, { color: T.accent }]}>{dietCount} selected</Text>
            </View>
          )}
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color={T.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search diets..."
            placeholderTextColor={T.textDim}
            value={dietQuery}
            onChangeText={handleDietQueryChange}
          />
        </View>

        {dietLoading ? (
          <ActivityIndicator color={T.accent} style={styles.loader} />
        ) : dietResults.length === 0 ? (
          <Text style={styles.emptyText}>No diets found.</Text>
        ) : (
          <View style={styles.dietList}>
            {dietResults.map((diet) => {
              const isSelected = !!selectedDiets[diet.id];
              return (
                <TouchableOpacity
                  key={diet.id}
                  style={[styles.dietCard, isSelected && styles.dietCardSelected]}
                  onPress={() => toggleDiet(diet)}
                  activeOpacity={0.75}
                >
                  <View style={styles.dietCardContent}>
                    <Text style={[styles.dietName, isSelected && styles.dietNameSelected]}>
                      {diet.name}
                    </Text>
                    {diet.summary ? (
                      <Text style={styles.dietSummary} numberOfLines={2}>
                        {diet.summary}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <View style={styles.dietCheckmark}>
                      <Check size={14} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Summary Panel */}
      <View style={styles.summaryPanel}>
        <View style={styles.summaryRow}>
          <Dumbbell size={16} color={T.primary} />
          <Text style={styles.summaryText}>
            {exCount} {exCount === 1 ? 'exercise' : 'exercises'} selected
          </Text>
          <Text style={styles.summaryDivider}>·</Text>
          <Text style={styles.summaryText}>
            {dietCount} {dietCount === 1 ? 'diet' : 'diets'} selected
          </Text>
        </View>

        {status.type !== 'idle' && (
          <View
            style={[
              styles.statusBanner,
              status.type === 'success' && styles.statusSuccess,
              status.type === 'error' && styles.statusError,
            ]}
          >
            <Text style={styles.statusText}>{status.message}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton,
            status.type === 'loading' && styles.sendButtonDisabled,
          ]}
          onPress={handleSendPlan}
          disabled={status.type === 'loading'}
          activeOpacity={0.85}
        >
          {status.type === 'loading' ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send Plan</Text>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    marginTop: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
  },
  sectionTitle: {
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
    marginBottom: T.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.spacing.sm,
  },
  countBadge: {
    backgroundColor: T.primary + '33',
    borderRadius: T.radius.full,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.bold,
    color: T.primary,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm + 2,
    borderWidth: 1,
    borderColor: T.border,
    gap: T.spacing.sm,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: T.fontSize.md,
    color: T.textDim,
  },
  dropdownSelectedText: {
    color: T.text,
  },
  dropdown: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border,
    marginTop: T.spacing.xs,
    overflow: 'hidden',
    maxHeight: 240,
  },
  dropdownEmpty: {
    padding: T.spacing.md,
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    gap: T.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  dropdownItemSelected: {
    backgroundColor: T.primary + '22',
  },
  dropdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: {
    color: '#ffffff',
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.bold,
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    color: T.text,
  },
  dropdownItemEmail: {
    fontSize: T.fontSize.xs,
    color: T.textMuted,
  },
  selectedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primary + '22',
    borderRadius: T.radius.lg,
    padding: T.spacing.sm,
    marginTop: T.spacing.sm,
    borderWidth: 1,
    borderColor: T.primary + '66',
    gap: T.spacing.sm,
  },
  selectedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAvatarText: {
    color: '#ffffff',
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
  },
  selectedClientInfo: {
    flex: 1,
  },
  selectedClientName: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
  },
  selectedClientEmail: {
    fontSize: T.fontSize.xs,
    color: T.textMuted,
  },
  orDivider: {
    textAlign: 'center',
    color: T.textDim,
    fontSize: T.fontSize.xs,
    marginVertical: T.spacing.sm,
  },
  input: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm + 2,
    color: T.text,
    fontSize: T.fontSize.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: T.fontSize.sm,
    color: T.text,
    paddingVertical: 0,
  },
  loader: {
    marginVertical: T.spacing.md,
  },
  emptyText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    textAlign: 'center',
    paddingVertical: T.spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.card,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: T.radius.lg,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs + 2,
  },
  chipSelected: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  chipContent: {
    flexDirection: 'column',
  },
  chipName: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    color: T.text,
  },
  chipNameSelected: {
    color: '#ffffff',
  },
  chipMeta: {
    fontSize: T.fontSize.xs,
    color: T.textDim,
  },
  dietList: {
    gap: T.spacing.sm,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    borderWidth: 1.5,
    borderColor: T.border,
    padding: T.spacing.md,
    gap: T.spacing.sm,
  },
  dietCardSelected: {
    borderColor: T.accent,
    backgroundColor: T.accent + '18',
  },
  dietCardContent: {
    flex: 1,
  },
  dietName: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    color: T.text,
    marginBottom: 2,
  },
  dietNameSelected: {
    color: T.accent,
  },
  dietSummary: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    lineHeight: 18,
  },
  dietCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryPanel: {
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.lg,
    backgroundColor: T.surface,
    borderRadius: T.radius.xl,
    padding: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.border,
    gap: T.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    flexWrap: 'wrap',
  },
  summaryText: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    fontWeight: T.fontWeight.medium,
  },
  summaryDivider: {
    color: T.textDim,
    fontSize: T.fontSize.sm,
  },
  statusBanner: {
    borderRadius: T.radius.md,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
  },
  statusSuccess: {
    backgroundColor: T.success + '22',
  },
  statusError: {
    backgroundColor: T.error + '22',
  },
  statusText: {
    fontSize: T.fontSize.sm,
    color: T.text,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: T.primary,
    borderRadius: T.radius.lg,
    paddingVertical: T.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
  },
});

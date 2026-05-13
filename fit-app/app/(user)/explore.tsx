import { T } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DietScreen from './diet';
import WorkoutScreen from './workout';

type ExploreTab = 'workout' | 'diet';

function normalizeTab(raw: unknown): ExploreTab | null {
  if (raw === 'workout' || raw === 'diet') return raw;
  return null;
}

export default function ExploreScreen() {
  const params = useLocalSearchParams();

  const initialTab = useMemo<ExploreTab>(() => {
    const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
    return normalizeTab(raw) ?? 'workout';
  }, [params.tab]);

  const [tab, setTab] = useState<ExploreTab>(initialTab);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} />

      <View style={styles.topBar}>
        <Text style={styles.title}>Explore</Text>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'workout' && styles.segmentBtnActive]}
            onPress={() => setTab('workout')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === 'workout' }}
            accessibilityLabel="Show workouts">
            <Text style={[styles.segmentText, tab === 'workout' && styles.segmentTextActive]}>
              Workouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'diet' && styles.segmentBtnActive]}
            onPress={() => setTab('diet')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === 'diet' }}
            accessibilityLabel="Show diet">
            <Text style={[styles.segmentText, tab === 'diet' && styles.segmentTextActive]}>
              Diet
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'workout' ? <WorkoutScreen /> : <DietScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },
  safeTop: {
    backgroundColor: T.background,
  },
  topBar: {
    paddingHorizontal: T.spacing.md,
    paddingTop: T.spacing.md,
    paddingBottom: T.spacing.sm,
    gap: T.spacing.sm,
    backgroundColor: T.background,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderRadius: T.radius.full,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentBtnActive: {
    backgroundColor: T.primary,
  },
  segmentText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
  },
  segmentTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
});


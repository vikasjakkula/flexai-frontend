import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Dumbbell, HeartPulse, Ruler, Settings2, Sparkles, User, Weight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

type WorkoutType = 'gym' | 'cardio' | 'yoga' | 'calisthenics';

const WORKOUT_CARDS: Array<{ key: WorkoutType; label: string; Icon: React.ComponentType<{ color: string; size: number }> }> = [
  { key: 'gym', label: 'Gym', Icon: Dumbbell },
  { key: 'cardio', label: 'Cardio', Icon: HeartPulse },
  { key: 'yoga', label: 'Yoga', Icon: Sparkles },
  { key: 'calisthenics', label: 'Calisthenics', Icon: Activity },
];

export default function SettingsScreen() {
  const { profile, saveProfile } = useUserProfile();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [workoutTypes, setWorkoutTypes] = useState<Array<WorkoutType>>((profile?.workoutTypes as Array<WorkoutType>) ?? []);

  const digits = (v: string, max = 3) => v.replace(/[^\d]/g, '').slice(0, max);
  const canSave = useMemo(() => (name.trim().length >= 2 || !profile?.name) && (editing || true), [name, profile?.name, editing]);

  const toggle = (k: WorkoutType) => {
    setWorkoutTypes((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const save = async () => {
    if (!canSave) return;
    await saveProfile({
      name: name.trim(),
      age: age ? Number(age) : null,
      heightCm: heightCm ? Number(heightCm) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      workoutTypes,
      fitnessType: workoutTypes[0] ?? profile?.fitnessType ?? null,
    });
    setEditing(false);
  };

  return (
    <LinearGradient colors={['#061A2D', '#04070B']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSub}>Profile & preferences</Text>
            </View>
            <View style={styles.headerIcon}>
              <Settings2 size={18} color="#0EA5FF" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <User size={16} color="rgba(234,246,255,0.7)" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  editable={editing}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="rgba(234,246,255,0.35)"
                  style={[styles.fieldInput, !editing && styles.fieldInputReadOnly]}
                />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={[styles.field, styles.half]}>
                <View style={styles.fieldIcon}>
                  <User size={16} color="rgba(234,246,255,0.7)" />
                </View>
                <View style={styles.fieldBody}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput
                    editable={editing}
                    value={age}
                    onChangeText={(v) => setAge(digits(v, 2))}
                    placeholder="e.g. 24"
                    placeholderTextColor="rgba(234,246,255,0.35)"
                    keyboardType="number-pad"
                    style={[styles.fieldInput, !editing && styles.fieldInputReadOnly]}
                  />
                </View>
              </View>

              <View style={[styles.field, styles.half]}>
                <View style={styles.fieldIcon}>
                  <Ruler size={16} color="rgba(234,246,255,0.7)" />
                </View>
                <View style={styles.fieldBody}>
                  <Text style={styles.fieldLabel}>Height (cm)</Text>
                  <TextInput
                    editable={editing}
                    value={heightCm}
                    onChangeText={(v) => setHeightCm(digits(v, 3))}
                    placeholder="e.g. 175"
                    placeholderTextColor="rgba(234,246,255,0.35)"
                    keyboardType="number-pad"
                    style={[styles.fieldInput, !editing && styles.fieldInputReadOnly]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Weight size={16} color="rgba(234,246,255,0.7)" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Weight (kg)</Text>
                <TextInput
                  editable={editing}
                  value={weightKg}
                  onChangeText={(v) => setWeightKg(digits(v, 3))}
                  placeholder="e.g. 70"
                  placeholderTextColor="rgba(234,246,255,0.35)"
                  keyboardType="number-pad"
                  style={[styles.fieldInput, !editing && styles.fieldInputReadOnly]}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout preferences</Text>
            <Text style={styles.sectionHint}>Tap to select. These power suggestions on your home screen.</Text>

            <View style={styles.grid}>
              {WORKOUT_CARDS.map(({ key, label, Icon }) => {
                const on = workoutTypes.includes(key);
                return (
                  <Pressable
                    key={key}
                    disabled={!editing}
                    onPress={() => toggle(key)}
                    style={({ pressed }) => [
                      styles.card,
                      on && styles.cardActive,
                      pressed && editing && styles.cardPressed,
                      !editing && styles.cardDisabled,
                    ]}>
                    <View style={[styles.cardIcon, on && styles.cardIconActive]}>
                      <Icon size={22} color={on ? '#001018' : 'rgba(234,246,255,0.75)'} />
                    </View>
                    <Text style={[styles.cardText, on && styles.cardTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            {!editing ? (
              <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]} onPress={() => setEditing(true)}>
                <Text style={styles.primaryBtnText}>Edit Profile</Text>
              </Pressable>
            ) : (
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    setEditing(false);
                    setName(profile?.name ?? '');
                    setAge(profile?.age ? String(profile.age) : '');
                    setHeightCm(profile?.heightCm ? String(profile.heightCm) : '');
                    setWeightKg(profile?.weightKg ? String(profile.weightKg) : '');
                    setWorkoutTypes((profile?.workoutTypes as Array<WorkoutType>) ?? []);
                  }}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={!canSave}
                  style={({ pressed }) => [styles.primaryBtn, !canSave && styles.btnDisabled, pressed && styles.btnPressed]}
                  onPress={save}>
                  <Text style={styles.primaryBtnText}>Save</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: T.spacing.lg, paddingTop: T.spacing.lg, paddingBottom: T.spacing.xxl },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerLeft: { gap: 4 },
  headerTitle: { color: '#EAF6FF', fontSize: 26, fontWeight: T.fontWeight.bold, letterSpacing: -0.4 },
  headerSub: { color: 'rgba(234,246,255,0.65)', fontSize: 12 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(14,165,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    backgroundColor: 'rgba(13,20,30,0.78)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234,246,255,0.10)',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { color: '#EAF6FF', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  sectionHint: { color: 'rgba(234,246,255,0.6)', fontSize: 12, marginBottom: 14, lineHeight: 16 },

  field: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(234,246,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 10,
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(234,246,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: { flex: 1, gap: 6 },
  fieldLabel: { color: 'rgba(234,246,255,0.6)', fontSize: 11, fontWeight: '700' },
  fieldInput: {
    color: '#EAF6FF',
    fontSize: 14,
    paddingVertical: 0,
  },
  fieldInputReadOnly: { opacity: 0.85 },

  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(234,246,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    gap: 10,
  },
  cardActive: { borderColor: 'rgba(14,165,255,0.65)', backgroundColor: 'rgba(14,165,255,0.10)' },
  cardPressed: { transform: [{ scale: 0.98 }], borderColor: 'rgba(14,165,255,0.35)' },
  cardDisabled: { opacity: 0.75 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(234,246,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(234,246,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconActive: { backgroundColor: '#0EA5FF', borderColor: '#0EA5FF' },
  cardText: { color: 'rgba(234,246,255,0.75)', fontSize: 13, fontWeight: '800' },
  cardTextActive: { color: '#EAF6FF' },

  actions: { marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 12 },

  primaryBtn: {
    flex: 1,
    backgroundColor: '#0EA5FF',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#001018', fontSize: 14, fontWeight: '900' },

  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(234,246,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(234,246,255,0.12)',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#EAF6FF', fontSize: 14, fontWeight: '800' },

  btnPressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  btnDisabled: { opacity: 0.45 },
});


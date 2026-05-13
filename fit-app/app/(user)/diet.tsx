import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import {
  Apple,
  Beef,
  Check,
  Coffee,
  Cookie,
  Drumstick,
  Flame,
  Lightbulb,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';

type FoodItem = {
  name: string;
  portion: string;
};

type Meal = {
  type: MealType;
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MEAL_META: Record<MealType, { icon: LucideIcon; color: string; tint: string }> = {
  Breakfast: { icon: Coffee, color: '#F59E0B', tint: '#3a2a1a' },
  Lunch: { icon: UtensilsCrossed, color: '#7C3AED', tint: '#26193f' },
  Snack: { icon: Cookie, color: '#10B981', tint: '#0f2d23' },
  Dinner: { icon: Drumstick, color: '#3B82F6', tint: '#15233f' },
};

function getMeals(goals: string[]): Meal[] {
  if (goals.includes('muscle_gain')) {
    return [
      {
        type: 'Breakfast',
        foods: [
          { name: 'Rolled Oats', portion: '80g' },
          { name: 'Whey Protein', portion: '1 scoop' },
          { name: 'Banana', portion: '1 medium' },
        ],
        calories: 500,
        protein: 45,
        carbs: 65,
        fat: 8,
      },
      {
        type: 'Lunch',
        foods: [
          { name: 'Chicken Breast', portion: '180g' },
          { name: 'White Rice', portion: '1 cup' },
          { name: 'Broccoli', portion: '1 cup' },
        ],
        calories: 650,
        protein: 55,
        carbs: 70,
        fat: 12,
      },
      {
        type: 'Snack',
        foods: [
          { name: 'Greek Yogurt', portion: '200g' },
          { name: 'Almonds', portion: '30g' },
        ],
        calories: 300,
        protein: 25,
        carbs: 18,
        fat: 14,
      },
      {
        type: 'Dinner',
        foods: [
          { name: 'Salmon Fillet', portion: '180g' },
          { name: 'Sweet Potato', portion: '200g' },
          { name: 'Spinach', portion: '1 cup' },
        ],
        calories: 600,
        protein: 50,
        carbs: 45,
        fat: 22,
      },
    ];
  }
  return [
    {
      type: 'Breakfast',
      foods: [
        { name: 'Egg Whites', portion: '4 whites' },
        { name: 'Oats', portion: '50g' },
        { name: 'Mixed Berries', portion: '1/2 cup' },
      ],
      calories: 350,
      protein: 30,
      carbs: 38,
      fat: 6,
    },
    {
      type: 'Lunch',
      foods: [
        { name: 'Grilled Chicken Salad', portion: '1 bowl' },
        { name: 'Quinoa', portion: '1/2 cup' },
      ],
      calories: 450,
      protein: 40,
      carbs: 42,
      fat: 12,
    },
    {
      type: 'Snack',
      foods: [{ name: 'Greek Yogurt', portion: '170g' }],
      calories: 150,
      protein: 15,
      carbs: 12,
      fat: 4,
    },
    {
      type: 'Dinner',
      foods: [
        { name: 'Baked Salmon', portion: '150g' },
        { name: 'Steamed Veggies', portion: '1 cup' },
      ],
      calories: 500,
      protein: 45,
      carbs: 28,
      fat: 20,
    },
  ];
}

function getTip(goals: string[]): string {
  if (goals.includes('muscle_gain')) {
    return 'Aim for 1.6–2.2g of protein per kg of bodyweight to maximize muscle protein synthesis.';
  }
  if (goals.includes('weight_loss')) {
    return 'Stay in a moderate caloric deficit of 300–500 kcal/day for sustainable fat loss.';
  }
  if (goals.includes('endurance')) {
    return 'Prioritize complex carbs before long sessions to fuel your performance.';
  }
  return 'Eat balanced meals with plenty of vegetables, lean protein, and whole grains.';
}

export default function DietScreen() {
  const { profile } = useUserProfile();
  const goals = profile?.goals ?? [];
  const meals = useMemo(() => getMeals(goals), [goals]);
  const tip = getTip(goals);
  const [mealDone, setMealDone] = useState<boolean[]>(() => meals.map(() => false));

  const toggleMeal = (i: number) => {
    setMealDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);

  const proteinCalories = totalProtein * 4;
  const carbCalories = totalCarbs * 4;
  const fatCalories = totalFat * 9;
  const macroTotal = proteinCalories + carbCalories + fatCalories || 1;

  const proteinPct = Math.round((proteinCalories / macroTotal) * 100);
  const carbPct = Math.round((carbCalories / macroTotal) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbPct);

  const doneCount = mealDone.filter(Boolean).length;
  const completionPct = Math.round((doneCount / meals.length) * 100);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <Apple color={T.accent} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Today's Diet</Text>
              <Text style={styles.headerSubtitle}>
                {doneCount} of {meals.length} meals · {totalCalories} kcal
              </Text>
            </View>
          </View>

          <View style={styles.headerProgressTrack}>
            <View style={[styles.headerProgressFill, { width: `${completionPct}%` }]} />
          </View>
        </View>

        {/* Macro summary chips */}
        <View style={styles.macroChipRow}>
          <MacroChip label="Protein" value={`${totalProtein}g`} color={T.accent} />
          <MacroChip label="Carbs" value={`${totalCarbs}g`} color={T.primaryLight} />
          <MacroChip label="Fat" value={`${totalFat}g`} color={T.warning} />
        </View>

        {/* Meal Cards */}
        <Text style={styles.sectionTitle}>Meals</Text>
        {meals.map((meal, i) => {
          const meta = MEAL_META[meal.type];
          const Icon = meta.icon;
          const isDone = mealDone[i];

          return (
            <View
              key={`${meal.type}-${i}`}
              style={[styles.mealCard, isDone && styles.mealCardDone]}>

              {/* Top row: meal type + done button */}
              <View style={styles.mealCardTop}>
                <View style={styles.mealTypeRow}>
                  <View style={[styles.mealIconBubble, { backgroundColor: meta.tint }]}>
                    <Icon color={meta.color} size={18} />
                  </View>
                  <View style={styles.mealTypeText}>
                    <Text style={[styles.mealType, { color: meta.color }]}>{meal.type}</Text>
                    <View style={styles.mealCaloriesRow}>
                      <Flame color={T.textDim} size={11} />
                      <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.doneBtn,
                    isDone ? styles.doneBtnActive : styles.doneBtnIdle,
                  ]}
                  onPress={() => toggleMeal(i)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isDone ? `Mark ${meal.type} not done` : `Mark ${meal.type} done`}>
                  {isDone ? (
                    <Check color="#fff" size={18} strokeWidth={3} />
                  ) : (
                    <View style={styles.doneBtnInnerEmpty} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Foods */}
              <View style={styles.foodsList}>
                {meal.foods.map((food, j) => (
                  <View key={j} style={styles.foodRow}>
                    <View style={[styles.foodDot, { backgroundColor: meta.color }]} />
                    <Text style={[styles.foodName, isDone && styles.foodNameDone]}>
                      {food.name}
                    </Text>
                    <Text style={styles.foodPortion}>{food.portion}</Text>
                  </View>
                ))}
              </View>

              {/* Nutrition row */}
              <View style={styles.nutritionRow}>
                <NutrientPill icon={Beef} label="P" value={`${meal.protein}g`} color={T.accent} />
                <NutrientPill icon={Wheat} label="C" value={`${meal.carbs}g`} color={T.primaryLight} />
                <NutrientPill icon={Cookie} label="F" value={`${meal.fat}g`} color={T.warning} />
              </View>
            </View>
          );
        })}

        {/* Macro Bars */}
        <Text style={styles.sectionTitle}>Daily Macros</Text>
        <View style={styles.macrosCard}>
          <MacroBar label="Protein" pct={proteinPct} color={T.accent} />
          <MacroBar label="Carbs" pct={carbPct} color={T.primaryLight} />
          <MacroBar label="Fat" pct={fatPct} color={T.warning} />
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.tipIconBubble}>
              <Lightbulb color={T.warning} size={16} />
            </View>
            <Text style={styles.tipTitle}>Nutrition Tip</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.macroChip}>
      <View style={[styles.macroChipDot, { backgroundColor: color }]} />
      <Text style={styles.macroChipLabel}>{label}</Text>
      <Text style={[styles.macroChipValue, { color }]}>{value}</Text>
    </View>
  );
}

function NutrientPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.nutrientPill}>
      <Icon color={color} size={12} />
      <Text style={styles.nutrientPillLabel}>{label}</Text>
      <Text style={[styles.nutrientPillValue, { color }]}>{value}</Text>
    </View>
  );
}

function MacroBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.macroBarRow}>
      <Text style={styles.macroBarLabel}>{label}</Text>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroBarPct}>{pct}%</Text>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
  },
  default: {},
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },
  safeTop: {
    backgroundColor: T.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: T.spacing.md,
    paddingBottom: T.spacing.xxl,
  },

  // Header
  header: {
    marginBottom: T.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    backgroundColor: '#1a3a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: T.text,
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
  },
  headerSubtitle: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    marginTop: 2,
  },
  headerProgressTrack: {
    height: 6,
    backgroundColor: T.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: T.accent,
    borderRadius: 3,
  },

  // Macro chip row
  macroChipRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  macroChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.sm,
    borderRadius: T.radius.md,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  macroChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroChipLabel: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
    flex: 1,
  },
  macroChipValue: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.bold,
  },

  sectionTitle: {
    color: T.text,
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    marginBottom: T.spacing.md,
  },

  // Meal card
  mealCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: T.border,
    ...cardShadow,
  },
  mealCardDone: {
    borderColor: T.success,
    backgroundColor: '#1d2a22',
  },
  mealCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.md,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    flex: 1,
  },
  mealIconBubble: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealType: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
    letterSpacing: 0.2,
  },
  mealTypeText: {
    flexShrink: 1,
  },
  mealCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mealCalories: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
  },

  // Done button
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  doneBtnIdle: {
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  doneBtnActive: {
    backgroundColor: T.success,
    borderColor: T.success,
  },
  doneBtnInnerEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },

  // Foods
  foodsList: {
    gap: T.spacing.xs,
    marginBottom: T.spacing.md,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodName: {
    color: T.text,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    flex: 1,
  },
  foodNameDone: {
    color: T.textMuted,
    textDecorationLine: 'line-through',
  },
  foodPortion: {
    color: T.textDim,
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.medium,
  },

  // Nutrition pills
  nutritionRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    paddingTop: T.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  nutrientPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: T.spacing.sm,
    backgroundColor: T.surface,
    borderRadius: T.radius.sm,
  },
  nutrientPillLabel: {
    color: T.textDim,
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.medium,
  },
  nutrientPillValue: {
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.bold,
  },

  // Macros card
  macrosCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.lg,
    gap: T.spacing.md,
    borderWidth: 1,
    borderColor: T.border,
    ...cardShadow,
  },
  macroBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  macroBarLabel: {
    color: T.text,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    width: 56,
  },
  macroBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: T.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroBarPct: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.semibold,
    width: 36,
    textAlign: 'right',
  },

  // Tip card
  tipCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: T.warning,
    ...cardShadow,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginBottom: T.spacing.xs,
  },
  tipIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a2a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    color: T.text,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
  },
  tipText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    lineHeight: 20,
  },
});

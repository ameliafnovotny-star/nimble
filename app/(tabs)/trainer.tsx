import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFitnessStore } from '../../store/useStore';
import { Workout, Category } from '../../store/types';
import { APP_COLORS } from '../../constants/Colors';
import { GenerateWorkoutModal } from '../../components/GenerateWorkoutModal';

// ---------------------------------------------------------------------------
// Muscle group classification
// ---------------------------------------------------------------------------
const MUSCLE_MAP: Record<string, string[]> = {
  Chest:        ['bench', 'chest', 'pec', 'fly', 'flye', 'push-up', 'pushup', 'push up', 'cable cross'],
  Shoulders:    ['shoulder', 'overhead press', 'lateral raise', 'front raise', 'upright row', 'arnold', 'military press', 'ohp', 'delt'],
  Triceps:      ['tricep', 'skull crusher', 'close grip', 'pushdown', 'triceps', 'overhead extension', 'dip'],
  Back:         ['row', 'pulldown', 'pull-down', 'pull down', 'lat ', 'deadlift', 'chin-up', 'chinup', 'chin up', 'pull-up', 'pullup', 'pull up', 'back', 'rhomboid', 'trap', 't-bar', 'hyperextension'],
  Biceps:       ['bicep', 'curl', 'hammer', 'preacher', 'concentration', 'biceps'],
  'Rear Delts': ['face pull', 'rear delt', 'reverse fly', 'reverse pec'],
  Quads:        ['squat', 'leg press', 'lunge', 'leg extension', 'quad', 'hack squat', 'step up', 'bulgarian'],
  Hamstrings:   ['hamstring', 'leg curl', 'romanian', 'rdl', 'stiff leg', 'nordic', 'glute ham'],
  Glutes:       ['glute', 'hip thrust', 'hip extension', 'sumo', 'bridge', 'kickback'],
  Calves:       ['calf', 'calves', 'calf raise'],
  Core:         ['crunch', 'sit-up', 'situp', 'sit up', 'plank', 'ab wheel', ' abs', 'core', 'oblique', 'leg raise', 'russian twist', 'cable crunch', 'hollow', 'dragon flag'],
  Cardio:       ['run', 'jog', 'bike', 'cycling', 'elliptical', 'treadmill', 'jump rope', 'burpee', 'sprint', 'cardio', 'hiit', 'stair', 'rowing machine'],
};

const EXERCISE_OPTIONS: Record<string, string[]> = {
  Chest:        ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Push-ups', 'Chest Dip', 'Decline Bench Press'],
  Shoulders:    ['Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Arnold Press', 'Front Raise', 'Machine Shoulder Press'],
  Triceps:      ['Tricep Pushdown', 'Skull Crushers', 'Close Grip Bench Press', 'Overhead Tricep Extension', 'Diamond Push-ups', 'Cable Kickback'],
  Back:         ['Barbell Row', 'Lat Pulldown', 'Pull-ups', 'Seated Cable Row', 'T-Bar Row', 'Dumbbell Row', 'Chest-Supported Row'],
  Biceps:       ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl', 'Incline Dumbbell Curl'],
  'Rear Delts': ['Face Pull', 'Reverse Fly', 'Band Pull-Apart', 'Bent-Over Lateral Raise'],
  Quads:        ['Barbell Squat', 'Leg Press', 'Lunges', 'Hack Squat', 'Leg Extension', 'Bulgarian Split Squat'],
  Hamstrings:   ['Romanian Deadlift', 'Leg Curl', 'Nordic Curl', 'Stiff-Leg Deadlift', 'Good Morning', 'Glute Ham Raise'],
  Glutes:       ['Hip Thrust', 'Glute Bridge', 'Sumo Deadlift', 'Bulgarian Split Squat', 'Cable Kickback', 'Abduction Machine'],
  Calves:       ['Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise', 'Leg Press Calf Raise'],
  Core:         ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Russian Twist', 'Ab Wheel Rollout', 'Decline Sit-ups'],
  Cardio:       ['Treadmill Run', 'Cycling', 'Jump Rope', 'Rowing Machine', 'Stair Climber', 'Assault Bike'],
};

function classifyExercise(name: string): string[] {
  const lower = ' ' + name.toLowerCase() + ' ';
  const found: string[] = [];
  for (const [muscle, keywords] of Object.entries(MUSCLE_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) found.push(muscle);
  }
  return found.length ? found : ['Other'];
}

// ---------------------------------------------------------------------------
// Rules & change generation
// ---------------------------------------------------------------------------
const RULES: Record<string, { required: string[]; forbidden: string[] }> = {
  Push:        { required: ['Chest', 'Shoulders', 'Triceps'],  forbidden: ['Back', 'Biceps', 'Hamstrings', 'Quads', 'Glutes', 'Calves', 'Cardio'] },
  Pull:        { required: ['Back', 'Biceps'],                 forbidden: ['Chest', 'Triceps', 'Hamstrings', 'Quads', 'Glutes', 'Calves', 'Cardio'] },
  Legs:        { required: ['Quads', 'Hamstrings'],            forbidden: ['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Cardio'] },
  Abs:         { required: ['Core'],                           forbidden: ['Chest', 'Back', 'Quads', 'Hamstrings', 'Cardio'] },
  Cardio:      { required: ['Cardio'],                         forbidden: ['Chest', 'Triceps', 'Biceps'] },
  'Full Body': { required: [],                                 forbidden: [] },
};

interface ProposedChange {
  id: string;
  workoutId: string;
  type: 'add' | 'replace' | 'remove';
  muscleGroup?: string;
  exerciseName: string;       // exercise to add / replacement exercise
  exerciseId?: string;        // for replace/remove: ID of exercise being removed
  replacedExerciseName?: string; // for replace: name of exercise being swapped out
  reason: string;
  alternatives?: string[];
}

function generateChanges(workout: Workout, catName: string): ProposedChange[] {
  const changes: ProposedChange[] = [];
  if (workout.exercises.length === 0) return changes;

  const muscleExs: Record<string, Array<{ id: string; name: string; sets: number }>> = {};
  for (const ex of workout.exercises) {
    for (const m of classifyExercise(ex.name)) {
      if (!muscleExs[m]) muscleExs[m] = [];
      muscleExs[m].push({ id: ex.id, name: ex.name, sets: ex.sets.length });
    }
  }

  const addChange = (c: ProposedChange) => changes.push(c);

  if (catName === 'Full Body') {
    const hasLower     = ['Quads', 'Hamstrings', 'Glutes'].some((m) => muscleExs[m]);
    const hasUpperPush = ['Chest', 'Shoulders', 'Triceps'].some((m) => muscleExs[m]);
    const hasUpperPull = ['Back', 'Biceps'].some((m) => muscleExs[m]);
    if (!hasLower)     addChange({ id: `${workout.id}-add-lower`,  workoutId: workout.id, type: 'add', muscleGroup: 'Quads',  exerciseName: 'Barbell Squat', reason: 'Full Body needs at least one lower body exercise.',       alternatives: EXERCISE_OPTIONS['Quads'] });
    if (!hasUpperPush) addChange({ id: `${workout.id}-add-uppush`, workoutId: workout.id, type: 'add', muscleGroup: 'Chest',  exerciseName: 'Bench Press',   reason: 'Full Body needs at least one upper body push exercise.', alternatives: EXERCISE_OPTIONS['Chest'] });
    if (!hasUpperPull) addChange({ id: `${workout.id}-add-uppull`, workoutId: workout.id, type: 'add', muscleGroup: 'Back',   exerciseName: 'Barbell Row',   reason: 'Full Body needs at least one upper body pull exercise.', alternatives: EXERCISE_OPTIONS['Back'] });
  } else {
    const rule = RULES[catName];
    if (!rule) return changes;

    for (const req of rule.required) {
      if (!muscleExs[req]) {
        const options = EXERCISE_OPTIONS[req] ?? [];
        addChange({ id: `${workout.id}-add-${req}`, workoutId: workout.id, type: 'add', muscleGroup: req, exerciseName: options[0] ?? req, reason: `No ${req} exercises — needed for a balanced ${catName} workout.`, alternatives: options });
      }
    }

    for (const forbidden of rule.forbidden) {
      for (const ex of muscleExs[forbidden] ?? []) {
        // Pick the required muscle group that is most underrepresented as the swap target
        const targetMuscle = rule.required
          .slice()
          .sort((a, b) => (muscleExs[a]?.length ?? 0) - (muscleExs[b]?.length ?? 0))[0] ?? rule.required[0];
        const existingNames = workout.exercises.map((e) => e.name.toLowerCase());
        const options = (EXERCISE_OPTIONS[targetMuscle] ?? []).filter(
          (o) => !existingNames.includes(o.toLowerCase())
        );
        addChange({
          id: `${workout.id}-replace-${ex.id}`,
          workoutId: workout.id,
          type: 'replace',
          muscleGroup: targetMuscle,
          exerciseName: options[0] ?? (EXERCISE_OPTIONS[targetMuscle]?.[0] ?? targetMuscle),
          exerciseId: ex.id,
          replacedExerciseName: ex.name,
          reason: `${ex.name} is a ${forbidden} exercise — doesn't belong in a ${catName} workout.`,
          alternatives: options.length ? options : EXERCISE_OPTIONS[targetMuscle],
        });
      }
    }

    if (rule.required.length > 1) {
      const totalSets = Object.entries(muscleExs).filter(([m]) => m !== 'Other').reduce((s, [, exs]) => s + exs.reduce((a, e) => a + e.sets, 0), 0);
      for (const [muscle, exs] of Object.entries(muscleExs)) {
        if (muscle === 'Other' || !rule.required.includes(muscle)) continue;
        const muscleSets = exs.reduce((s, e) => s + e.sets, 0);
        if (totalSets > 0 && muscleSets / totalSets > 0.6 && exs.length > 2) {
          for (const ex of exs.slice(2)) {
            addChange({ id: `${workout.id}-excess-${ex.id}`, workoutId: workout.id, type: 'remove', exerciseName: ex.name, exerciseId: ex.id, reason: `${muscle} makes up over 60% of this workout. Removing excess to improve balance.` });
          }
        }
      }
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function TrainerScreen() {
  const { workouts, categories, addExercise, removeExercise } = useFitnessStore();

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [deniedIds, setDeniedIds] = useState<string[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [altIndexes, setAltIndexes] = useState<Record<string, number>>({});
  const [showGenerate, setShowGenerate] = useState(false);

  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId) ?? null;
  const selectedCat = categories.find((c) => c.id === selectedWorkout?.categoryId);

  const allChanges = useMemo(() => {
    if (!selectedWorkout) return [];
    return generateChanges(selectedWorkout, selectedCat?.name ?? '');
  }, [selectedWorkout, selectedCat]);

  const pending = allChanges.filter((c) => !deniedIds.includes(c.id) && !confirmedIds.includes(c.id));

  const getExerciseName = (change: ProposedChange) => {
    if (!change.alternatives?.length) return change.exerciseName;
    const idx = altIndexes[change.id] ?? 0;
    return change.alternatives[idx % change.alternatives.length];
  };

  const cycleAlt = (change: ProposedChange) => {
    const current = altIndexes[change.id] ?? 0;
    setAltIndexes((prev) => ({ ...prev, [change.id]: current + 1 }));
  };

  const handleConfirm = (change: ProposedChange) => {
    if (change.type === 'add') {
      addExercise(change.workoutId, getExerciseName(change));
    } else if (change.type === 'replace' && change.exerciseId) {
      removeExercise(change.workoutId, change.exerciseId);
      addExercise(change.workoutId, getExerciseName(change));
    } else if (change.type === 'remove' && change.exerciseId) {
      removeExercise(change.workoutId, change.exerciseId);
    }
    setConfirmedIds((prev) => [...prev, change.id]);
  };

  const handleDeny = (change: ProposedChange) => setDeniedIds((prev) => [...prev, change.id]);

  const handleBack = () => {
    setSelectedWorkoutId(null);
    setDeniedIds([]);
    setConfirmedIds([]);
    setAltIndexes({});
  };

  // ---- Workout picker ----
  if (!selectedWorkoutId) {
    if (workouts.length === 0) {
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={60} color={APP_COLORS.border} />
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptyText}>Create workouts on the Workouts tab, or let Nimble build a plan for you.</Text>
            <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerate(true)} activeOpacity={0.85}>
              <Ionicons name="sparkles-outline" size={18} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Workout Plan</Text>
            </TouchableOpacity>
          </View>
          <GenerateWorkoutModal visible={showGenerate} onClose={() => setShowGenerate(false)} />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.generateCard} onPress={() => setShowGenerate(true)} activeOpacity={0.85}>
            <Ionicons name="sparkles-outline" size={20} color={APP_COLORS.primary} />
            <View style={styles.generateCardText}>
              <Text style={styles.generateCardTitle}>Generate Workout Plan</Text>
              <Text style={styles.generateCardSub}>Answer 4 quick questions to get a beginner plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={APP_COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.pickerHeading}>Choose a workout to analyse</Text>
          {workouts.map((w) => {
            const cat = categories.find((c) => c.id === w.categoryId);
            return (
              <TouchableOpacity
                key={w.id}
                style={[styles.pickCard, { borderLeftColor: cat?.color ?? APP_COLORS.border }]}
                onPress={() => setSelectedWorkoutId(w.id)}
                activeOpacity={0.75}
              >
                <View style={styles.pickCardBody}>
                  <Text style={styles.pickCardName}>{w.name}</Text>
                  <Text style={styles.pickCardMeta}>
                    {cat?.name ?? 'Uncategorized'} · {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
        <GenerateWorkoutModal visible={showGenerate} onClose={() => setShowGenerate(false)} />
      </SafeAreaView>
    );
  }

  // ---- Changes view ----
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <TouchableOpacity style={styles.backRow} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={APP_COLORS.primary} />
          <Text style={styles.backText}>All Workouts</Text>
        </TouchableOpacity>

        <View style={[styles.workoutBanner, { borderLeftColor: selectedCat?.color ?? APP_COLORS.border }]}>
          <Text style={styles.workoutBannerName}>{selectedWorkout?.name}</Text>
          {selectedCat && (
            <View style={[styles.catBadge, { backgroundColor: selectedCat.color + '22' }]}>
              <View style={[styles.catDot, { backgroundColor: selectedCat.color }]} />
              <Text style={[styles.catBadgeText, { color: selectedCat.color }]}>{selectedCat.name}</Text>
            </View>
          )}
        </View>

        {pending.length === 0 ? (
          <View style={styles.allGood}>
            <Ionicons name="checkmark-circle" size={48} color={APP_COLORS.success} />
            <Text style={styles.allGoodTitle}>Looks great!</Text>
            <Text style={styles.allGoodText}>No imbalances or missing muscle groups detected.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.changesHint}>
              {pending.length} suggestion{pending.length !== 1 ? 's' : ''} — confirm to apply or deny to skip.
            </Text>

            {pending.map((change) => {
              const exerciseName = getExerciseName(change);
              const altCount = change.alternatives?.length ?? 0;
              const currentAltIdx = (altIndexes[change.id] ?? 0) % (altCount || 1);

              return (
                <View key={change.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[
                      styles.typeTag,
                      change.type === 'add' ? styles.typeTagAdd :
                      change.type === 'replace' ? styles.typeTagReplace :
                      styles.typeTagRemove,
                    ]}>
                      <Ionicons
                        name={change.type === 'add' ? 'add' : change.type === 'replace' ? 'swap-horizontal' : 'remove'}
                        size={12}
                        color={change.type === 'add' ? APP_COLORS.success : change.type === 'replace' ? APP_COLORS.primary : APP_COLORS.destructive}
                      />
                      <Text style={[
                        styles.typeTagText,
                        change.type === 'add' ? styles.typeTagTextAdd :
                        change.type === 'replace' ? styles.typeTagTextReplace :
                        styles.typeTagTextRemove,
                      ]}>
                        {change.type === 'add' ? 'Add' : change.type === 'replace' ? 'Replace' : 'Remove'}
                      </Text>
                    </View>
                    {change.muscleGroup && (
                      <Text style={styles.muscleLabel}>{change.muscleGroup}</Text>
                    )}
                  </View>

                  {change.type === 'replace' ? (
                    <View style={styles.replaceRow}>
                      <Text style={styles.replaceOld}>"{change.replacedExerciseName}"</Text>
                      <Ionicons name="arrow-forward" size={16} color={APP_COLORS.textSecondary} />
                      <Text style={styles.replaceNew}>"{exerciseName}"</Text>
                    </View>
                  ) : (
                    <Text style={styles.exerciseName}>"{exerciseName}"</Text>
                  )}
                  <Text style={styles.reason}>{change.reason}</Text>

                  {(change.type === 'add' || change.type === 'replace') && altCount > 1 && (
                    <TouchableOpacity style={styles.altBtn} onPress={() => cycleAlt(change)} activeOpacity={0.7}>
                      <Ionicons name="refresh-outline" size={14} color={APP_COLORS.primary} />
                      <Text style={styles.altBtnText}>
                        Try another suggestion ({currentAltIdx + 1}/{altCount})
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.denyBtn} onPress={() => handleDeny(change)} activeOpacity={0.75}>
                      <Ionicons name="close" size={16} color={APP_COLORS.textSecondary} />
                      <Text style={styles.denyText}>Deny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(change)} activeOpacity={0.75}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                      <Text style={styles.confirmText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { padding: 16 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12, paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  emptyText: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  generateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.primary + '12',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary + '40',
    gap: 12,
  },
  generateCardText: { flex: 1, gap: 2 },
  generateCardTitle: { fontSize: 15, fontWeight: '700', color: APP_COLORS.primary },
  generateCardSub: { fontSize: 13, color: APP_COLORS.primary + 'AA' },
  pickerHeading: { fontSize: 13, fontWeight: '700', color: APP_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  pickCardBody: { flex: 1, gap: 4 },
  pickCardName: { fontSize: 16, fontWeight: '600', color: APP_COLORS.text },
  pickCardMeta: { fontSize: 13, color: APP_COLORS.textSecondary },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  backText: { fontSize: 15, color: APP_COLORS.primary, fontWeight: '500' },

  workoutBanner: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    marginBottom: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutBannerName: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  catBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 5 },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '600' },

  allGood: { alignItems: 'center', paddingTop: 40, gap: 12 },
  allGoodTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  allGoodText: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  changesHint: { fontSize: 13, color: APP_COLORS.textSecondary, marginBottom: 12 },

  card: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeTagAdd:         { backgroundColor: APP_COLORS.success + '1A' },
  typeTagReplace:     { backgroundColor: APP_COLORS.primary + '1A' },
  typeTagRemove:      { backgroundColor: APP_COLORS.destructive + '1A' },
  typeTagText:        { fontSize: 12, fontWeight: '700' },
  typeTagTextAdd:     { color: APP_COLORS.success },
  typeTagTextReplace: { color: APP_COLORS.primary },
  typeTagTextRemove:  { color: APP_COLORS.destructive },
  replaceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  replaceOld:  { fontSize: 16, fontWeight: '600', color: APP_COLORS.textSecondary, textDecorationLine: 'line-through' },
  replaceNew:  { fontSize: 17, fontWeight: '700', color: APP_COLORS.text },
  muscleLabel: { fontSize: 13, color: APP_COLORS.textSecondary, fontWeight: '500' },

  exerciseName: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  reason: { fontSize: 13, color: APP_COLORS.textSecondary, lineHeight: 19 },

  altBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  altBtnText: { fontSize: 13, color: APP_COLORS.primary, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 10 },
  denyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: APP_COLORS.border },
  denyText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textSecondary },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: APP_COLORS.primary },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});

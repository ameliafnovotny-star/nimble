import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import { useFitnessStore } from '../store/useStore';
import { generateWorkouts, DaysPerWeek, Goal, Equipment, Injury } from '../lib/workoutGenerator';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DAY_OPTIONS: { value: DaysPerWeek; label: string; sub: string }[] = [
  { value: 3, label: '3 Days', sub: 'Push · Pull · Legs' },
  { value: 4, label: '4 Days', sub: 'Push · Pull · Legs · Shoulders & Core' },
  { value: 5, label: '5 Days', sub: 'Chest · Back · Legs · Shoulders · Core & Cardio' },
];

const GOAL_OPTIONS: { value: Goal; label: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'muscle',      label: 'Build Muscle',     sub: 'Strength and hypertrophy focus',       icon: 'barbell-outline'  },
  { value: 'weight_loss', label: 'Lose Weight',       sub: 'Strength + cardio circuit mix',        icon: 'flame-outline'    },
  { value: 'general',     label: 'General Fitness',   sub: 'Balanced strength and endurance',      icon: 'heart-outline'    },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'full_gym',   label: 'Full Gym',         sub: 'Barbells, machines, and dumbbells',  icon: 'barbell-outline' },
  { value: 'dumbbells',  label: 'Dumbbells Only',   sub: 'Dumbbell and bodyweight exercises',  icon: 'fitness-outline' },
  { value: 'none',       label: 'No Equipment',     sub: 'Bodyweight exercises only',          icon: 'body-outline'    },
];

const INJURY_OPTIONS: { value: Injury | 'none'; label: string }[] = [
  { value: 'none',        label: 'None'        },
  { value: 'knees',       label: 'Knees'       },
  { value: 'shoulders',   label: 'Shoulders'   },
  { value: 'lower_back',  label: 'Lower Back'  },
  { value: 'wrists',      label: 'Wrists'      },
];

const STEP_TITLES = ['Days per week', 'Your goal', 'Equipment', 'Any injuries?'];

export function GenerateWorkoutModal({ visible, onClose }: Props) {
  const { addWorkout, addExercise } = useFitnessStore();

  const [step, setStep] = useState(0);
  const [days, setDays] = useState<DaysPerWeek | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [done, setDone] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const reset = () => {
    setStep(0); setDays(null); setGoal(null);
    setEquipment(null); setInjuries([]); setDone(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleInjury = (val: Injury | 'none') => {
    if (val === 'none') {
      setInjuries([]);
    } else {
      setInjuries((prev) =>
        prev.includes(val as Injury) ? prev.filter((i) => i !== val) : [...prev, val as Injury]
      );
    }
  };

  const canNext =
    (step === 0 && days !== null) ||
    (step === 1 && goal !== null) ||
    (step === 2 && equipment !== null) ||
    step === 3;

  const preview = days && goal && equipment
    ? generateWorkouts(days, goal, equipment, injuries)
    : [];

  const handleGenerate = () => {
    const workouts = generateWorkouts(days!, goal!, equipment!, injuries);
    for (const w of workouts) {
      const workout = addWorkout(w.name, w.categoryId);
      for (const exName of w.exercises) {
        addExercise(workout.id, exName);
        const state = useFitnessStore.getState();
        const latest = state.workouts.find((wk) => wk.id === workout.id);
        const lastEx = latest?.exercises[latest.exercises.length - 1];
        if (lastEx) {
          state.addSet(workout.id, lastEx.id);
          state.addSet(workout.id, lastEx.id);
        }
      }
    }
    setGeneratedCount(workouts.length);
    setDone(true);
  };

  if (done) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={72} color={APP_COLORS.success} />
            <Text style={styles.successTitle}>{generatedCount} workouts added!</Text>
            <Text style={styles.successSub}>
              Find them in your Workouts tab, ready to schedule and start.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {step > 0
            ? <TouchableOpacity onPress={() => setStep(step - 1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={24} color={APP_COLORS.primary} />
              </TouchableOpacity>
            : <View style={{ width: 24 }} />
          }
          <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Step 0 — Days */}
          {step === 0 && DAY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optCard, days === opt.value && styles.optCardSelected]}
              onPress={() => setDays(opt.value)}
              activeOpacity={0.75}
            >
              <View style={styles.optText}>
                <Text style={[styles.optLabel, days === opt.value && styles.optLabelSelected]}>{opt.label}</Text>
                <Text style={[styles.optSub, days === opt.value && styles.optSubSelected]}>{opt.sub}</Text>
              </View>
              {days === opt.value && <Ionicons name="checkmark-circle" size={22} color={APP_COLORS.primary} />}
            </TouchableOpacity>
          ))}

          {/* Step 1 — Goal */}
          {step === 1 && GOAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optCard, goal === opt.value && styles.optCardSelected]}
              onPress={() => setGoal(opt.value)}
              activeOpacity={0.75}
            >
              <View style={[styles.optIcon, goal === opt.value && styles.optIconSelected]}>
                <Ionicons name={opt.icon} size={22} color={goal === opt.value ? APP_COLORS.primary : APP_COLORS.textSecondary} />
              </View>
              <View style={styles.optText}>
                <Text style={[styles.optLabel, goal === opt.value && styles.optLabelSelected]}>{opt.label}</Text>
                <Text style={[styles.optSub, goal === opt.value && styles.optSubSelected]}>{opt.sub}</Text>
              </View>
              {goal === opt.value && <Ionicons name="checkmark-circle" size={22} color={APP_COLORS.primary} />}
            </TouchableOpacity>
          ))}

          {/* Step 2 — Equipment */}
          {step === 2 && EQUIPMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optCard, equipment === opt.value && styles.optCardSelected]}
              onPress={() => setEquipment(opt.value)}
              activeOpacity={0.75}
            >
              <View style={[styles.optIcon, equipment === opt.value && styles.optIconSelected]}>
                <Ionicons name={opt.icon} size={22} color={equipment === opt.value ? APP_COLORS.primary : APP_COLORS.textSecondary} />
              </View>
              <View style={styles.optText}>
                <Text style={[styles.optLabel, equipment === opt.value && styles.optLabelSelected]}>{opt.label}</Text>
                <Text style={[styles.optSub, equipment === opt.value && styles.optSubSelected]}>{opt.sub}</Text>
              </View>
              {equipment === opt.value && <Ionicons name="checkmark-circle" size={22} color={APP_COLORS.primary} />}
            </TouchableOpacity>
          ))}

          {/* Step 3 — Injuries */}
          {step === 3 && (
            <>
              <Text style={styles.injuryHint}>
                Exercises that strain injured areas will be automatically avoided.
              </Text>
              <View style={styles.chips}>
                {INJURY_OPTIONS.map((opt) => {
                  const isSelected = opt.value === 'none'
                    ? injuries.length === 0
                    : injuries.includes(opt.value as Injury);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => toggleInjury(opt.value)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {preview.length > 0 && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>Your {days}-day plan</Text>
                  {preview.map((w, i) => (
                    <View key={i} style={styles.previewRow}>
                      <Text style={styles.previewWorkoutName}>{w.name}</Text>
                      <Text style={styles.previewExercises} numberOfLines={2}>{w.exercises.join(' · ')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !canNext && styles.primaryBtnDisabled]}
            onPress={step < 3 ? () => setStep(step + 1) : handleGenerate}
            disabled={!canNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {step === 3 ? `Generate ${preview.length} Workouts` : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: APP_COLORS.text },

  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: APP_COLORS.border },
  progressDotActive: { backgroundColor: APP_COLORS.primary, width: 20 },

  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  optCardSelected: { borderColor: APP_COLORS.primary, backgroundColor: APP_COLORS.primary + '08' },
  optIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optIconSelected: { backgroundColor: APP_COLORS.primary + '18' },
  optText: { flex: 1, gap: 3 },
  optLabel: { fontSize: 16, fontWeight: '600', color: APP_COLORS.text },
  optLabelSelected: { color: APP_COLORS.primary },
  optSub: { fontSize: 13, color: APP_COLORS.textSecondary },
  optSubSelected: { color: APP_COLORS.primary + 'CC' },

  injuryHint: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 21, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: APP_COLORS.card,
    borderWidth: 1.5,
    borderColor: APP_COLORS.border,
  },
  chipSelected: { backgroundColor: APP_COLORS.primary + '15', borderColor: APP_COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textSecondary },
  chipTextSelected: { color: APP_COLORS.primary },

  preview: { marginTop: 8, gap: 8 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: APP_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  previewRow: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  previewWorkoutName: { fontSize: 15, fontWeight: '700', color: APP_COLORS.text },
  previewExercises: { fontSize: 13, color: APP_COLORS.textSecondary, lineHeight: 19 },

  footer: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 },
  primaryBtn: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 },
  successTitle: { fontSize: 26, fontWeight: '700', color: APP_COLORS.text },
  successSub: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});

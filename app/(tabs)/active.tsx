import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFitnessStore } from '../../store/useStore';
import { APP_COLORS } from '../../constants/Colors';
import { Confetti } from '../../components/Confetti';

function useElapsed(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveScreen() {
  const { workouts, categories, activeSession, completedSessions, startSession, endSession, toggleSetComplete, updateSet } =
    useFitnessStore();

  const [showPicker, setShowPicker] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editingCell, setEditingCell] = useState<{ exerciseId: string; setId: string; field: 'weight' | 'reps' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<TextInput>(null);

  const commitEdit = (workoutId: string) => {
    if (!editingCell) return;
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      updateSet(workoutId, editingCell.exerciseId, editingCell.setId, {
        [editingCell.field]: editingCell.field === 'reps' ? Math.round(num) : num,
      });
    }
    setEditingCell(null);
  };
  const elapsed = useElapsed(activeSession?.startedAt ?? null);

  const workout = workouts.find((w) => w.id === activeSession?.workoutId);
  const category = categories.find((c) => c.id === workout?.categoryId);

  const lastSession = workout
    ? completedSessions
        .filter((s) => s.workoutId === workout.id)
        .sort((a, b) => b.endedAt.localeCompare(a.endedAt))[0] ?? null
    : null;

  const totalSets = workout?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0;
  const doneSets = Object.keys(activeSession?.completedSets ?? {}).length;

  const handleFinish = () => {
    const confirm = () => {
      setShowConfetti(true);
      setTimeout(() => endSession(), 1800);
    };
    if (typeof window !== 'undefined') {
      if (window.confirm('Finish this workout?')) confirm();
    } else {
      Alert.alert('Finish Workout', 'Mark this workout as complete?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', onPress: confirm },
      ]);
    }
  };

  if (!activeSession || !workout) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.idle}>
          <Ionicons name="barbell-outline" size={64} color={APP_COLORS.border} />
          <Text style={styles.idleTitle}>No Active Workout</Text>
          <Text style={styles.idleText}>Pick a workout to start tracking your session.</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPicker(false)}
        >
          <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Workout</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalDone}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {workouts.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  No workouts yet. Create one on the Workouts tab first.
                </Text>
              </View>
            ) : (
              <FlatList
                data={workouts}
                keyExtractor={(w) => w.id}
                contentContainerStyle={styles.pickerList}
                renderItem={({ item }) => {
                  const cat = categories.find((c) => c.id === item.categoryId);
                  return (
                    <TouchableOpacity
                      style={[styles.pickerRow, { borderLeftColor: cat?.color ?? APP_COLORS.border }]}
                      onPress={() => { startSession(item.id); setShowPicker(false); }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.pickerRowBody}>
                        <Text style={styles.pickerRowName}>{item.name}</Text>
                        {cat && (
                          <View style={[styles.catBadge, { backgroundColor: cat.color + '22' }]}>
                            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                            <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.name}</Text>
                          </View>
                        )}
                        <Text style={styles.pickerRowMeta}>
                          {item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'} ·{' '}
                          {item.exercises.reduce((s, e) => s + e.sets.length, 0)} sets
                        </Text>
                      </View>
                      <Ionicons name="play-circle-outline" size={28} color={APP_COLORS.primary} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.sessionHeader, { borderBottomColor: category?.color ?? APP_COLORS.border }]}>
        <View style={styles.sessionHeaderLeft}>
          <Text style={styles.sessionName}>{workout.name}</Text>
          {category && (
            <View style={[styles.catBadge, { backgroundColor: category.color + '22' }]}>
              <View style={[styles.catDot, { backgroundColor: category.color }]} />
              <Text style={[styles.catBadgeText, { color: category.color }]}>{category.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.sessionHeaderRight}>
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
          <Text style={styles.progress}>{doneSets}/{totalSets} sets</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {workout.exercises.map((ex) => {
          const exDone = ex.sets.every((s) => activeSession.completedSets[`${ex.id}-${s.id}`]);
          const prevEx = lastSession?.exercises.find((e) => e.exerciseId === ex.id);
          const allPrevDone = !!prevEx && prevEx.sets.length > 0 && prevEx.sets.every((s) => s.completed);
          const maxPrevWeight = allPrevDone ? Math.max(...prevEx!.sets.map((s) => s.weight)) : 0;
          const suggestedWeight = maxPrevWeight > 0 ? maxPrevWeight + 5 : 0;
          return (
            <View key={ex.id} style={[styles.exerciseCard, exDone && styles.exerciseCardDone]}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, exDone && styles.exerciseNameDone]}>{ex.name}</Text>
                {exDone && (
                  <Ionicons name="checkmark-circle" size={18} color={APP_COLORS.success} />
                )}
                {!exDone && suggestedWeight > 0 && (
                  <View style={styles.progressChip}>
                    <Ionicons name="trending-up" size={12} color="#FFF" />
                    <Text style={styles.progressChipText}>Try {suggestedWeight} lbs</Text>
                  </View>
                )}
              </View>

              <View style={styles.setHeader}>
                <View style={styles.setCol}>
                  <Text style={styles.setColLabel}>Set</Text>
                </View>
                <View style={styles.setCol}>
                  <Text style={styles.setColLabel}>Weight</Text>
                  {lastSession && <Text style={styles.setColSub}>prev</Text>}
                </View>
                <View style={styles.setCol}>
                  <Text style={styles.setColLabel}>Reps</Text>
                  {lastSession && <Text style={styles.setColSub}>prev</Text>}
                </View>
                <View style={styles.setCheck} />
              </View>

              {ex.sets.map((s, idx) => {
                const done = !!activeSession.completedSets[`${ex.id}-${s.id}`];
                const prevEx = lastSession?.exercises.find((e) => e.exerciseId === ex.id);
                const prevSet = prevEx?.sets[idx];
                const editingWeight = editingCell?.exerciseId === ex.id && editingCell.setId === s.id && editingCell.field === 'weight';
                const editingReps = editingCell?.exerciseId === ex.id && editingCell.setId === s.id && editingCell.field === 'reps';

                const startEdit = (field: 'weight' | 'reps') => {
                  setEditingCell({ exerciseId: ex.id, setId: s.id, field });
                  setEditValue(field === 'weight' ? String(s.weight) : String(s.reps));
                  setTimeout(() => editRef.current?.focus(), 50);
                };

                return (
                  <View
                    key={s.id}
                    style={[styles.setRow, done && styles.setRowDone]}
                  >
                    <TouchableOpacity style={styles.setCol} onPress={() => toggleSetComplete(ex.id, s.id)} activeOpacity={0.7}>
                      <Text style={[styles.setNum, done && styles.setTextDone]}>{idx + 1}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.setCol} onPress={() => startEdit('weight')} activeOpacity={0.7}>
                      {editingWeight ? (
                        <TextInput
                          ref={editRef}
                          style={styles.cellInput}
                          value={editValue}
                          onChangeText={setEditValue}
                          keyboardType="decimal-pad"
                          returnKeyType="done"
                          onBlur={() => commitEdit(workout.id)}
                          onSubmitEditing={() => commitEdit(workout.id)}
                          selectTextOnFocus
                        />
                      ) : (
                        <Text style={[styles.setVal, styles.setValCenter, done && styles.setTextDone]}>
                          {s.weight > 0 ? `${s.weight} lbs` : '—'}
                        </Text>
                      )}
                      {!editingWeight && prevSet && (
                        <Text style={styles.prevHint}>
                          {prevSet.weight > 0 ? `${prevSet.weight} lbs` : '—'}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.setCol} onPress={() => startEdit('reps')} activeOpacity={0.7}>
                      {editingReps ? (
                        <TextInput
                          ref={editRef}
                          style={styles.cellInput}
                          value={editValue}
                          onChangeText={setEditValue}
                          keyboardType="number-pad"
                          returnKeyType="done"
                          onBlur={() => commitEdit(workout.id)}
                          onSubmitEditing={() => commitEdit(workout.id)}
                          selectTextOnFocus
                        />
                      ) : (
                        <Text style={[styles.setVal, styles.setValCenter, done && styles.setTextDone]}>
                          {s.reps}
                        </Text>
                      )}
                      {!editingReps && prevSet && (
                        <Text style={styles.prevHint}>{prevSet.reps}</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.setCheck} onPress={() => toggleSetComplete(ex.id, s.id)} activeOpacity={0.7}>
                      <View style={[styles.checkbox, done && styles.checkboxDone]}>
                        {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
          <Text style={styles.finishBtnText}>Finish Workout</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },

  idle: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  idleTitle: { fontSize: 22, fontWeight: '700', color: APP_COLORS.text, marginTop: 12 },
  idleText: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  startBtn: {
    marginTop: 12,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 36,
    paddingVertical: 15,
    borderRadius: 14,
  },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  modal: { flex: 1, backgroundColor: APP_COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  modalDone: { fontSize: 17, color: APP_COLORS.primary, fontWeight: '600' },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  modalEmptyText: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  pickerList: { paddingHorizontal: 16, paddingBottom: 40 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
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
  pickerRowBody: { flex: 1, gap: 6 },
  pickerRowName: { fontSize: 16, fontWeight: '600', color: APP_COLORS.text },
  pickerRowMeta: { fontSize: 13, color: APP_COLORS.textSecondary },

  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '600' },

  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: APP_COLORS.card,
    borderBottomWidth: 3,
    gap: 12,
  },
  sessionHeaderLeft: { flex: 1, gap: 6 },
  sessionName: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  sessionHeaderRight: { alignItems: 'flex-end', gap: 2 },
  timer: { fontSize: 22, fontWeight: '700', color: APP_COLORS.primary, fontVariant: ['tabular-nums'] },
  progress: { fontSize: 13, color: APP_COLORS.textSecondary, fontWeight: '500' },

  scroll: { padding: 16 },

  exerciseCard: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseCardDone: { opacity: 0.7 },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLORS.border,
  },
  exerciseName: { flex: 1, fontSize: 16, fontWeight: '700', color: APP_COLORS.text },
  exerciseNameDone: { color: APP_COLORS.textSecondary },
  progressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressChipText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  cellInput: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.primary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.primary,
    minWidth: 48,
    paddingVertical: 2,
  },

  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: APP_COLORS.background,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP_COLORS.border,
  },
  setRowDone: { backgroundColor: APP_COLORS.success + '0A' },
  setCol: { flex: 1, alignItems: 'center' },
  setColLabel: { fontSize: 11, fontWeight: '700', color: APP_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  setColSub: { fontSize: 10, color: APP_COLORS.textSecondary, opacity: 0.6, marginTop: 1 },
  setNum: { fontSize: 15, fontWeight: '600', color: APP_COLORS.text },
  setVal: { fontSize: 15, color: APP_COLORS.text },
  setValCenter: { textAlign: 'center' },
  prevHint: { fontSize: 11, color: APP_COLORS.textSecondary, opacity: 0.7, marginTop: 2, textAlign: 'center' },
  setTextDone: { color: APP_COLORS.textSecondary },
  setCheck: { width: 40, alignItems: 'center' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: APP_COLORS.success,
    borderColor: APP_COLORS.success,
  },

  finishBtn: {
    marginTop: 8,
    backgroundColor: APP_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

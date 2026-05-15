import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFitnessStore } from '../../store/useStore';
import { Calendar } from '../../components/Calendar';
import { CategoryBadge } from '../../components/CategoryBadge';
import { APP_COLORS } from '../../constants/Colors';
import { CompletedSession } from '../../store/types';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function CalendarScreen() {
  const { categories, workouts, scheduledWorkouts, completedSessions, scheduleWorkout, removeScheduledWorkout } =
    useFitnessStore();

  const [selectedDate, setSelectedDate] = useState(todayString);
  const [showPicker, setShowPicker] = useState(false);
  const [detailSession, setDetailSession] = useState<CompletedSession | null>(null);

  const markedDates = useMemo(() => {
    const map: Record<string, { color: string }[]> = {};
    scheduledWorkouts.forEach((sw) => {
      const wo = workouts.find((w) => w.id === sw.workoutId);
      const cat = categories.find((c) => c.id === wo?.categoryId);
      if (!map[sw.date]) map[sw.date] = [];
      map[sw.date].push({ color: cat?.color ?? '#8E8E93' });
    });
    return map;
  }, [scheduledWorkouts, workouts, categories]);

  const dayEntries = useMemo(() => {
    return scheduledWorkouts
      .filter((sw) => sw.date === selectedDate)
      .map((sw) => {
        const wo = workouts.find((w) => w.id === sw.workoutId);
        const cat = categories.find((c) => c.id === wo?.categoryId);
        const session = sw.completedAt
          ? completedSessions
              .filter((s) => s.workoutId === sw.workoutId && s.date === sw.date)
              .sort((a, b) => b.endedAt.localeCompare(a.endedAt))[0] ?? null
          : null;
        return { scheduled: sw, workout: wo, category: cat, session };
      })
      .filter((e) => e.workout != null);
  }, [selectedDate, scheduledWorkouts, workouts, categories, completedSessions]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Calendar
          markedDates={markedDates}
          onDayPress={setSelectedDate}
          selectedDate={selectedDate}
        />

        <View style={styles.daySection}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle} numberOfLines={1}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>

          {dayEntries.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayIcon}>🏋️</Text>
              <Text style={styles.emptyDayText}>No workouts scheduled</Text>
              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.scheduleBtnText}>Add a Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dayEntries.map(({ scheduled, workout, category, session }) => (
              <TouchableOpacity
                key={scheduled.id}
                style={[styles.dayCard, { borderLeftColor: category?.color ?? APP_COLORS.border }]}
                onPress={() => session && setDetailSession(session)}
                activeOpacity={session ? 0.75 : 1}
              >
                <View style={styles.dayCardBody}>
                  <View style={styles.dayCardNameRow}>
                    <Text style={styles.dayCardName}>{workout!.name}</Text>
                    {scheduled.completedAt && (
                      <View style={styles.doneBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={APP_COLORS.success} />
                        <Text style={styles.doneBadgeText}>Done</Text>
                      </View>
                    )}
                  </View>
                  {category && <CategoryBadge category={category} small />}
                  {session ? (
                    <Text style={styles.dayCardMeta}>
                      {session.exercises.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0)} sets ·{' '}
                      {session.exercises.reduce((v, e) => v + e.sets.filter(s => s.completed).reduce((sv, s) => sv + s.weight * s.reps, 0), 0).toLocaleString()} lbs total · tap to view
                    </Text>
                  ) : (
                    <Text style={styles.dayCardMeta}>
                      {workout!.exercises.length}{' '}
                      {workout!.exercises.length === 1 ? 'exercise' : 'exercises'}
                    </Text>
                  )}
                </View>
                <View style={styles.dayCardActions}>
                  {session && (
                    <Ionicons name="chevron-forward" size={16} color={APP_COLORS.textSecondary} />
                  )}
                  <TouchableOpacity
                    onPress={() => removeScheduledWorkout(scheduled.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Workout</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSub}>{formatDisplayDate(selectedDate)}</Text>

          {workouts.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyTitle}>No workouts yet</Text>
              <Text style={styles.modalEmptyHint}>
                Go to the Workouts tab to create your first workout.
              </Text>
            </View>
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(w) => w.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      { borderLeftColor: cat?.color ?? APP_COLORS.border },
                    ]}
                    onPress={() => {
                      scheduleWorkout(selectedDate, item.id);
                      setShowPicker(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.modalItemTop}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      {cat && <CategoryBadge category={cat} small />}
                    </View>
                    <Text style={styles.modalItemMeta}>
                      {item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Session detail modal */}
      <Modal
        visible={detailSession !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailSession(null)}
      >
        {detailSession && (() => {
          const totalSets = detailSession.exercises.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0);
          const totalVolume = detailSession.exercises.reduce((v, e) => v + e.sets.filter(s => s.completed).reduce((sv, s) => sv + s.weight * s.reps, 0), 0);
          const mins = Math.floor(detailSession.durationSeconds / 60);
          return (
            <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{detailSession.workoutName}</Text>
                <TouchableOpacity onPress={() => setDetailSession(null)}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSub}>{formatDisplayDate(detailSession.date)}</Text>

              {/* Summary stats */}
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalSets}</Text>
                  <Text style={styles.statLabel}>Sets Done</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalVolume > 0 ? `${totalVolume.toLocaleString()}` : '—'}</Text>
                  <Text style={styles.statLabel}>Lbs Lifted</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{mins > 0 ? `${mins}m` : '<1m'}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.modalList}>
                {detailSession.exercises.map((ex) => {
                  const completedSets = ex.sets.filter(s => s.completed);
                  return (
                    <View key={ex.exerciseId} style={styles.detailCard}>
                      <View style={styles.detailExHeader}>
                        <Text style={styles.detailExName}>{ex.exerciseName}</Text>
                        <Text style={styles.detailExCount}>{completedSets.length}/{ex.sets.length} sets</Text>
                      </View>
                      {ex.sets.map((s, i) => (
                        <View key={i} style={[styles.detailSetRow, !s.completed && styles.detailSetSkipped]}>
                          <View style={styles.detailSetBullet}>
                            {s.completed
                              ? <Ionicons name="checkmark-circle" size={16} color={APP_COLORS.success} />
                              : <Ionicons name="ellipse-outline" size={16} color={APP_COLORS.border} />
                            }
                          </View>
                          <Text style={styles.detailSetNum}>Set {i + 1}</Text>
                          <Text style={styles.detailSetWeight}>
                            {s.weight > 0 ? `${s.weight} lbs` : 'bodyweight'}
                          </Text>
                          <Text style={styles.detailSetReps}>× {s.reps} reps</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { paddingBottom: 40 },
  daySection: { paddingHorizontal: 16, marginTop: 20 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  dayTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: APP_COLORS.text },
  addBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  emptyDay: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyDayIcon: { fontSize: 40 },
  emptyDayText: { fontSize: 15, color: APP_COLORS.textSecondary },
  scheduleBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary + '50',
    backgroundColor: APP_COLORS.primary + '0D',
  },
  scheduleBtnText: { color: APP_COLORS.primary, fontWeight: '600', fontSize: 15 },
  dayCard: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardBody: { flex: 1, gap: 5 },
  dayCardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayCardName: { fontSize: 16, fontWeight: '600', color: APP_COLORS.text },
  dayCardMeta: { fontSize: 12, color: APP_COLORS.textSecondary },
  dayCardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  doneBadgeText: { fontSize: 11, fontWeight: '600', color: APP_COLORS.success },
  removeIcon: { fontSize: 16, color: APP_COLORS.textSecondary },
  modal: { flex: 1, backgroundColor: APP_COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  modalDone: { fontSize: 17, color: APP_COLORS.primary, fontWeight: '600' },
  modalSub: { fontSize: 14, color: APP_COLORS.textSecondary, paddingHorizontal: 20, marginBottom: 16 },
  modalList: { paddingHorizontal: 16, paddingBottom: 40 },
  modalItem: {
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
    gap: 5,
  },
  modalItemTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalItemName: { fontSize: 16, fontWeight: '600', color: APP_COLORS.text, flex: 1 },
  modalItemMeta: { fontSize: 13, color: APP_COLORS.textSecondary },
  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  modalEmptyTitle: { fontSize: 18, fontWeight: '600', color: APP_COLORS.text },
  modalEmptyHint: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  statRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: APP_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: APP_COLORS.border },
  detailCard: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  detailExHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLORS.border,
  },
  detailExName: { flex: 1, fontSize: 15, fontWeight: '700', color: APP_COLORS.text },
  detailExCount: { fontSize: 12, color: APP_COLORS.textSecondary, fontWeight: '500' },
  detailSetHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: APP_COLORS.background,
  },
  detailSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP_COLORS.border,
    gap: 10,
  },
  detailSetSkipped: { opacity: 0.35 },
  detailSetBullet: { width: 20, alignItems: 'center' },
  detailSetNum: { fontSize: 13, color: APP_COLORS.textSecondary, fontWeight: '500', width: 40 },
  detailSetWeight: { flex: 1, fontSize: 15, fontWeight: '700', color: APP_COLORS.text },
  detailSetReps: { fontSize: 14, color: APP_COLORS.textSecondary },
  detailSetCol: { flex: 1, textAlign: 'center' },
  detailSetLabel: { fontSize: 11, fontWeight: '700', color: APP_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailSetVal: { fontSize: 14, color: APP_COLORS.text },
});

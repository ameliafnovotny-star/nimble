import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Workout, WorkoutExercise, SetEntry, ScheduledWorkout, ActiveSession, CompletedSession, CompletedSessionExercise } from './types';
import { supabase } from '../lib/supabase';
import { scheduleWorkoutReminder, cancelWorkoutReminder } from '../lib/notifications';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Push', color: '#FF6B6B' },
  { id: '2', name: 'Pull', color: '#4ECDC4' },
  { id: '3', name: 'Legs', color: '#45B7D1' },
  { id: '4', name: 'Cardio', color: '#2ECC71' },
  { id: '5', name: 'Abs', color: '#FFC300' },
  { id: '6', name: 'Full Body', color: '#A29BFE' },
];

interface FitnessStore {
  categories: Category[];
  workouts: Workout[];
  scheduledWorkouts: ScheduledWorkout[];
  completedSessions: CompletedSession[];
  activeSession: ActiveSession | null;
  hasSeenOnboarding: boolean;
  markOnboardingSeen: () => void;

  addCategory: (name: string, color: string) => Category;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;

  addWorkout: (name: string, categoryId: string) => Workout;
  updateWorkout: (id: string, updates: Partial<Omit<Workout, 'id' | 'createdAt'>>) => void;
  deleteWorkout: (id: string) => void;

  addExercise: (workoutId: string, name: string) => void;
  updateExercise: (workoutId: string, exerciseId: string, updates: Partial<Omit<WorkoutExercise, 'id'>>) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;

  addSet: (workoutId: string, exerciseId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, updates: Partial<Omit<SetEntry, 'id'>>) => void;
  removeSet: (workoutId: string, exerciseId: string, setId: string) => void;

  scheduleWorkout: (date: string, workoutId: string) => void;
  removeScheduledWorkout: (id: string) => void;
  markCompleted: (id: string) => void;

  startSession: (workoutId: string) => void;
  endSession: () => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  logPastSession: (workoutId: string, date: string, scheduledId: string, exercises: CompletedSessionExercise[]) => void;

  lastSyncedAt: string | null;
  syncError: string | null;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

export const useFitnessStore = create<FitnessStore>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      workouts: [],
      scheduledWorkouts: [],
      completedSessions: [],
      activeSession: null,
      hasSeenOnboarding: false,
      lastSyncedAt: null,
      syncError: null,

      markOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      addCategory: (name, color) => {
        const category: Category = { id: uid(), name, color };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addWorkout: (name, categoryId) => {
        const workout: Workout = {
          id: uid(),
          name,
          categoryId,
          exercises: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ workouts: [...s.workouts, workout] }));
        return workout;
      },
      updateWorkout: (id, updates) =>
        set((s) => ({
          workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      deleteWorkout: (id) =>
        set((s) => ({
          workouts: s.workouts.filter((w) => w.id !== id),
          scheduledWorkouts: s.scheduledWorkouts.filter((sw) => sw.workoutId !== id),
        })),

      addExercise: (workoutId, name) => {
        const exercise: WorkoutExercise = {
          id: uid(),
          name,
          sets: [{ id: uid(), reps: 10, weight: 0 }],
        };
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId ? { ...w, exercises: [...w.exercises, exercise] } : w
          ),
        }));
      },
      updateExercise: (workoutId, exerciseId, updates) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId ? { ...e, ...updates } : e
                  ),
                }
              : w
          ),
        })),
      removeExercise: (workoutId, exerciseId) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
              : w
          ),
        })),

      addSet: (workoutId, exerciseId) => {
        const workout = get().workouts.find((w) => w.id === workoutId);
        const exercise = workout?.exercises.find((e) => e.id === exerciseId);
        const last = exercise?.sets[exercise.sets.length - 1];
        const newSet: SetEntry = { id: uid(), reps: last?.reps ?? 10, weight: last?.weight ?? 0 };
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e
                  ),
                }
              : w
          ),
        }));
      },
      updateSet: (workoutId, exerciseId, setId, updates) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? { ...e, sets: e.sets.map((st) => (st.id === setId ? { ...st, ...updates } : st)) }
                      : e
                  ),
                }
              : w
          ),
        })),
      removeSet: (workoutId, exerciseId, setId) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? { ...e, sets: e.sets.filter((st) => st.id !== setId) }
                      : e
                  ),
                }
              : w
          ),
        })),

      scheduleWorkout: (date, workoutId) => {
        const entry: ScheduledWorkout = { id: uid(), date, workoutId };
        set((s) => ({ scheduledWorkouts: [...s.scheduledWorkouts, entry] }));
        const workout = get().workouts.find((w) => w.id === workoutId);
        if (workout) scheduleWorkoutReminder(entry.id, workout.name, date);
      },
      removeScheduledWorkout: (id) => {
        cancelWorkoutReminder(id);
        set((s) => ({ scheduledWorkouts: s.scheduledWorkouts.filter((sw) => sw.id !== id) }));
      },
      markCompleted: (id) =>
        set((s) => ({
          scheduledWorkouts: s.scheduledWorkouts.map((sw) =>
            sw.id === id ? { ...sw, completedAt: new Date().toISOString() } : sw
          ),
        })),

      startSession: (workoutId) =>
        set({ activeSession: { workoutId, startedAt: new Date().toISOString(), completedSets: {}, pausedSeconds: 0 } }),
      endSession: () =>
        set((s) => {
          if (!s.activeSession) return s;
          const now = new Date();
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const workout = s.workouts.find((w) => w.id === s.activeSession!.workoutId);
          const scheduled: ScheduledWorkout = {
            id: uid(),
            date: dateStr,
            workoutId: s.activeSession.workoutId,
            completedAt: now.toISOString(),
          };
          const pausedSecs = s.activeSession.pausedSeconds ?? 0;
          const currentPauseSecs = s.activeSession.pausedAt
            ? Math.floor((now.getTime() - new Date(s.activeSession.pausedAt).getTime()) / 1000)
            : 0;
          const durationSeconds = Math.max(0, Math.floor(
            (now.getTime() - new Date(s.activeSession.startedAt).getTime()) / 1000
          ) - pausedSecs - currentPauseSecs);
          const session: CompletedSession = {
            id: uid(),
            workoutId: s.activeSession.workoutId,
            workoutName: workout?.name ?? '',
            date: dateStr,
            startedAt: s.activeSession.startedAt,
            endedAt: now.toISOString(),
            durationSeconds,
            exercises: (workout?.exercises ?? []).map((ex) => ({
              exerciseId: ex.id,
              exerciseName: ex.name,
              sets: ex.sets.map((st) => ({
                reps: st.reps,
                weight: st.weight,
                completed: !!s.activeSession!.completedSets[`${ex.id}-${st.id}`],
              })),
            })),
          };
          return {
            activeSession: null,
            scheduledWorkouts: [...s.scheduledWorkouts, scheduled],
            completedSessions: [...s.completedSessions, session],
          };
        }),
      toggleSetComplete: (exerciseId, setId) =>
        set((s) => {
          if (!s.activeSession) return s;
          const key = `${exerciseId}-${setId}`;
          const completedSets = { ...s.activeSession.completedSets };
          if (completedSets[key]) {
            delete completedSets[key];
          } else {
            completedSets[key] = true;
          }
          return { activeSession: { ...s.activeSession, completedSets } };
        }),
      pauseSession: () =>
        set((s) => {
          if (!s.activeSession || s.activeSession.pausedAt) return s;
          return { activeSession: { ...s.activeSession, pausedAt: new Date().toISOString() } };
        }),
      resumeSession: () =>
        set((s) => {
          if (!s.activeSession || !s.activeSession.pausedAt) return s;
          const additional = Math.floor((Date.now() - new Date(s.activeSession.pausedAt).getTime()) / 1000);
          return {
            activeSession: {
              ...s.activeSession,
              pausedAt: undefined,
              pausedSeconds: (s.activeSession.pausedSeconds ?? 0) + additional,
            },
          };
        }),
      logPastSession: (workoutId, date, scheduledId, exercises) =>
        set((s) => {
          const workout = s.workouts.find((w) => w.id === workoutId);
          const now = new Date().toISOString();
          const session: CompletedSession = {
            id: uid(),
            workoutId,
            workoutName: workout?.name ?? '',
            date,
            startedAt: now,
            endedAt: now,
            durationSeconds: 0,
            exercises,
          };
          return {
            completedSessions: [...s.completedSessions, session],
            scheduledWorkouts: s.scheduledWorkouts.map((sw) =>
              sw.id === scheduledId ? { ...sw, completedAt: now } : sw
            ),
          };
        }),

      syncToCloud: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const s = get();
        const { error } = await supabase.from('app_state').upsert({
          user_id: user.id,
          categories: s.categories,
          workouts: s.workouts,
          scheduled_workouts: s.scheduledWorkouts,
          completed_sessions: s.completedSessions,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          set({ syncError: error.message });
        } else {
          set({ lastSyncedAt: new Date().toISOString(), syncError: null });
        }
      },

      syncFromCloud: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('app_state')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') {
          set({ syncError: error.message });
          return;
        }
        if (!data) {
          await get().syncToCloud();
          return;
        }
        const s = get();

        // Merge completed sessions: union of cloud + local so locally-saved
        // sessions that haven't synced yet (e.g. app closed before 3s debounce)
        // are never lost.
        const cloudSessions: CompletedSession[] = data.completed_sessions ?? [];
        const sessionMap = new Map<string, CompletedSession>();
        for (const item of cloudSessions) sessionMap.set(item.id, item);
        for (const item of s.completedSessions) sessionMap.set(item.id, item);

        // Merge scheduled workouts the same way, preferring whichever copy
        // has a completedAt timestamp (i.e. the finished version wins).
        const cloudScheduled: ScheduledWorkout[] = data.scheduled_workouts ?? [];
        const scheduledMap = new Map<string, ScheduledWorkout>();
        for (const item of cloudScheduled) scheduledMap.set(item.id, item);
        for (const item of s.scheduledWorkouts) {
          const existing = scheduledMap.get(item.id);
          scheduledMap.set(item.id, (item.completedAt && !existing?.completedAt) ? item : (existing ?? item));
        }

        const merged = {
          categories: data.categories ?? DEFAULT_CATEGORIES,
          workouts: data.workouts ?? [],
          scheduledWorkouts: Array.from(scheduledMap.values()),
          completedSessions: Array.from(sessionMap.values()),
          lastSyncedAt: new Date().toISOString(),
          syncError: null,
        };
        set(merged);
        // Push the merged result back so cloud and local are in sync.
        await get().syncToCloud();
      },
    }),
    {
      name: 'fittrack-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Workout, WorkoutExercise, SetEntry, ScheduledWorkout, ActiveSession, CompletedSession } from './types';

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

}

export const useFitnessStore = create<FitnessStore>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      workouts: [],
      scheduledWorkouts: [],
      completedSessions: [],
      activeSession: null,

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
      },
      removeScheduledWorkout: (id) =>
        set((s) => ({ scheduledWorkouts: s.scheduledWorkouts.filter((sw) => sw.id !== id) })),
      markCompleted: (id) =>
        set((s) => ({
          scheduledWorkouts: s.scheduledWorkouts.map((sw) =>
            sw.id === id ? { ...sw, completedAt: new Date().toISOString() } : sw
          ),
        })),

      startSession: (workoutId) =>
        set({ activeSession: { workoutId, startedAt: new Date().toISOString(), completedSets: {} } }),
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
          const durationSeconds = Math.floor(
            (now.getTime() - new Date(s.activeSession.startedAt).getTime()) / 1000
          );
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
    }),
    {
      name: 'fittrack-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

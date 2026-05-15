export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface SetEntry {
  id: string;
  reps: number;
  weight: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  name: string;
  categoryId: string;
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface ScheduledWorkout {
  id: string;
  date: string;
  workoutId: string;
  completedAt?: string;
}

export interface ActiveSession {
  workoutId: string;
  startedAt: string;
  completedSets: Record<string, boolean>; // key: `${exerciseId}-${setId}`
}

export interface CompletedSessionSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface CompletedSessionExercise {
  exerciseId: string;
  exerciseName: string;
  sets: CompletedSessionSet[];
}

export interface CompletedSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  exercises: CompletedSessionExercise[];
}

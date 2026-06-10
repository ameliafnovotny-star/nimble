export type DaysPerWeek = 3 | 4 | 5;
export type Goal = 'muscle' | 'weight_loss' | 'general';
export type Equipment = 'full_gym' | 'dumbbells' | 'none';
export type Injury = 'knees' | 'shoulders' | 'lower_back' | 'wrists';

export interface GeneratedWorkout {
  name: string;
  categoryId: string;
  exercises: string[];
}

const EXERCISE_POOL: Record<string, Record<Equipment, string[]>> = {
  Chest: {
    full_gym: ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Chest Dip', 'Decline Bench Press'],
    dumbbells: ['Dumbbell Press', 'Incline Dumbbell Press', 'Dumbbell Fly', 'Decline Dumbbell Press'],
    none: ['Push-ups', 'Wide Push-ups', 'Decline Push-ups', 'Incline Push-ups'],
  },
  Shoulders: {
    full_gym: ['Overhead Press', 'Lateral Raise', 'Face Pull', 'Front Raise', 'Arnold Press'],
    dumbbells: ['Dumbbell Shoulder Press', 'Lateral Raise', 'Front Raise', 'Arnold Press'],
    none: ['Pike Push-ups', 'Lateral Raise', 'Front Raise'],
  },
  Triceps: {
    full_gym: ['Tricep Pushdown', 'Overhead Tricep Extension', 'Skull Crushers', 'Tricep Dips'],
    dumbbells: ['Overhead Tricep Extension', 'Dumbbell Kickback', 'Tricep Dips'],
    none: ['Diamond Push-ups', 'Tricep Dips', 'Close Grip Push-ups'],
  },
  Back: {
    full_gym: ['Lat Pulldown', 'Seated Cable Row', 'Barbell Row', 'Pull-ups', 'Chest-Supported Row'],
    dumbbells: ['Dumbbell Row', 'Pull-ups', 'Dumbbell Pullover', 'Chest-Supported Row'],
    none: ['Pull-ups', 'Inverted Row', 'Superman'],
  },
  Biceps: {
    full_gym: ['Barbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl'],
    dumbbells: ['Dumbbell Curl', 'Hammer Curl', 'Incline Dumbbell Curl', 'Concentration Curl'],
    none: ['Chin-ups', 'Hammer Curl'],
  },
  'Rear Delts': {
    full_gym: ['Face Pull', 'Reverse Fly', 'Bent-Over Lateral Raise'],
    dumbbells: ['Reverse Fly', 'Bent-Over Lateral Raise'],
    none: ['Reverse Fly', 'Band Pull-Apart'],
  },
  Quads: {
    full_gym: ['Barbell Squat', 'Leg Press', 'Leg Extension', 'Hack Squat', 'Bulgarian Split Squat'],
    dumbbells: ['Goblet Squat', 'Dumbbell Lunge', 'Bulgarian Split Squat', 'Step-ups'],
    none: ['Bodyweight Squat', 'Lunges', 'Jump Squat', 'Wall Sit'],
  },
  Hamstrings: {
    full_gym: ['Romanian Deadlift', 'Leg Curl', 'Nordic Curl', 'Stiff-Leg Deadlift'],
    dumbbells: ['Romanian Deadlift', 'Nordic Curl', 'Single-Leg Deadlift'],
    none: ['Nordic Curl', 'Single-Leg Hip Bridge', 'Good Morning'],
  },
  Glutes: {
    full_gym: ['Hip Thrust', 'Glute Bridge', 'Cable Kickback'],
    dumbbells: ['Hip Thrust', 'Glute Bridge', 'Dumbbell Sumo Squat'],
    none: ['Hip Thrust', 'Glute Bridge', 'Donkey Kicks'],
  },
  Calves: {
    full_gym: ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise'],
    dumbbells: ['Standing Calf Raise', 'Single-Leg Calf Raise'],
    none: ['Calf Raise', 'Single-Leg Calf Raise'],
  },
  Core: {
    full_gym: ['Plank', 'Hanging Leg Raise', 'Cable Crunch', 'Russian Twist', 'Dead Bug'],
    dumbbells: ['Plank', 'Russian Twist', 'Leg Raises', 'Dead Bug', 'Dumbbell Side Bend'],
    none: ['Plank', 'Crunches', 'Leg Raises', 'Bicycle Crunches', 'Russian Twist'],
  },
  Cardio: {
    full_gym: ['Treadmill Run', 'Rowing Machine', 'Stair Climber', 'Jump Rope'],
    dumbbells: ['Jump Rope', 'Burpees', 'Mountain Climbers'],
    none: ['Burpees', 'Mountain Climbers', 'High Knees', 'Jumping Jacks'],
  },
};

export const INJURY_EXCLUSIONS: Record<Injury, string[]> = {
  knees: [
    'Barbell Squat', 'Goblet Squat', 'Leg Press', 'Leg Extension', 'Hack Squat',
    'Lunges', 'Dumbbell Lunge', 'Bulgarian Split Squat', 'Jump Squat', 'Wall Sit',
    'Step-ups', 'Bodyweight Squat', 'Dumbbell Sumo Squat', 'Stair Climber',
  ],
  shoulders: [
    'Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Front Raise',
    'Arnold Press', 'Pike Push-ups', 'Face Pull', 'Incline Dumbbell Press',
    'Decline Bench Press', 'Decline Dumbbell Press', 'Wide Push-ups', 'Incline Push-ups',
  ],
  lower_back: [
    'Barbell Row', 'Romanian Deadlift', 'Stiff-Leg Deadlift', 'Single-Leg Deadlift',
    'Dumbbell Row', 'Good Morning', 'Ab Wheel Rollout',
  ],
  wrists: [
    'Barbell Curl', 'Skull Crushers', 'Overhead Press', 'Close Grip Push-ups',
  ],
};

interface WorkoutTemplate {
  name: string;
  categoryId: string;
  muscles: Array<{ group: string; count: number }>;
}

const TEMPLATES: Record<DaysPerWeek, WorkoutTemplate[]> = {
  3: [
    { name: 'Push', categoryId: '1', muscles: [{ group: 'Chest', count: 2 }, { group: 'Shoulders', count: 2 }, { group: 'Triceps', count: 1 }] },
    { name: 'Pull', categoryId: '2', muscles: [{ group: 'Back', count: 2 }, { group: 'Biceps', count: 2 }, { group: 'Rear Delts', count: 1 }] },
    { name: 'Legs', categoryId: '3', muscles: [{ group: 'Quads', count: 2 }, { group: 'Hamstrings', count: 1 }, { group: 'Glutes', count: 1 }, { group: 'Calves', count: 1 }] },
  ],
  4: [
    { name: 'Push', categoryId: '1', muscles: [{ group: 'Chest', count: 3 }, { group: 'Triceps', count: 2 }] },
    { name: 'Pull', categoryId: '2', muscles: [{ group: 'Back', count: 3 }, { group: 'Biceps', count: 2 }] },
    { name: 'Legs', categoryId: '3', muscles: [{ group: 'Quads', count: 2 }, { group: 'Hamstrings', count: 2 }, { group: 'Glutes', count: 1 }, { group: 'Calves', count: 1 }] },
    { name: 'Shoulders & Core', categoryId: '6', muscles: [{ group: 'Shoulders', count: 3 }, { group: 'Core', count: 2 }] },
  ],
  5: [
    { name: 'Chest & Triceps', categoryId: '1', muscles: [{ group: 'Chest', count: 3 }, { group: 'Triceps', count: 2 }] },
    { name: 'Back & Biceps', categoryId: '2', muscles: [{ group: 'Back', count: 3 }, { group: 'Biceps', count: 2 }] },
    { name: 'Legs', categoryId: '3', muscles: [{ group: 'Quads', count: 2 }, { group: 'Hamstrings', count: 2 }, { group: 'Glutes', count: 1 }, { group: 'Calves', count: 1 }] },
    { name: 'Shoulders & Arms', categoryId: '6', muscles: [{ group: 'Shoulders', count: 3 }, { group: 'Biceps', count: 1 }, { group: 'Triceps', count: 1 }] },
    { name: 'Core & Cardio', categoryId: '5', muscles: [{ group: 'Core', count: 3 }, { group: 'Cardio', count: 2 }] },
  ],
};

export function generateWorkouts(
  days: DaysPerWeek,
  goal: Goal,
  equipment: Equipment,
  injuries: Injury[],
): GeneratedWorkout[] {
  const excluded = new Set(injuries.flatMap((i) => INJURY_EXCLUSIONS[i]));

  const pick = (group: string, count: number): string[] =>
    (EXERCISE_POOL[group]?.[equipment] ?? [])
      .filter((ex) => !excluded.has(ex))
      .slice(0, count);

  return TEMPLATES[days].map((template) => {
    const exercises: string[] = [];
    for (const { group, count } of template.muscles) {
      exercises.push(...pick(group, count));
    }
    if (goal === 'weight_loss' && !template.muscles.some((m) => m.group === 'Cardio')) {
      exercises.push(...pick('Cardio', 1));
    }
    return { name: template.name, categoryId: template.categoryId, exercises };
  });
}

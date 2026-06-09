import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return;
  await Notifications.requestPermissionsAsync();
}

export async function scheduleWorkoutReminder(
  scheduledId: string,
  workoutName: string,
  date: string,
) {
  if (Platform.OS === 'web') return;
  const [year, month, day] = date.split('-').map(Number);
  const triggerDate = new Date(year, month - 1, day, 8, 0, 0);
  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: scheduledId,
    content: {
      title: `Workout Today: ${workoutName}`,
      body: 'Time to crush your workout 💪',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  }).catch(() => {});
}

export async function cancelWorkoutReminder(scheduledId: string) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(scheduledId).catch(() => {});
}

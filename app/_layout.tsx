import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { useFitnessStore } from '../store/useStore';
import { APP_COLORS } from '../constants/Colors';
import { OnboardingModal } from '../components/OnboardingModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { requestNotificationPermissions } from '../lib/notifications';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const syncToCloud = useFitnessStore((s) => s.syncToCloud);
  const syncFromCloud = useFitnessStore((s) => s.syncFromCloud);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    return initialize();
  }, []);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (userId && userId !== prevUserIdRef.current) {
      syncFromCloud();
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    const unsub = useFitnessStore.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(syncToCloud, 3000);
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <StatusBar style="dark" />
      <OnboardingModal />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/[id]"
          options={{
            title: 'Workout',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: APP_COLORS.background },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            title: 'Categories',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: APP_COLORS.background },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack>
    </>
  );
}

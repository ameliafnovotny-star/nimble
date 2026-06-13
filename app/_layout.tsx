import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../store/authStore';
import { useFitnessStore } from '../store/useStore';
import { APP_COLORS } from '../constants/Colors';
import { OnboardingModal } from '../components/OnboardingModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { requestNotificationPermissions } from '../lib/notifications';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const loading = useAuthStore((s) => s.loading);
  const isResettingPassword = useAuthStore((s) => s.isResettingPassword);
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
    const handleUrl = async (url: string) => {
      const hash = url.split('#')[1];
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      if (accessToken && refreshToken && type === 'recovery') {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    };

    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
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
      <ResetPasswordModal visible={isResettingPassword} />
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

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/[id]"
          options={{
            title: 'Workout',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: '#F2F2F7' },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            title: 'Categories',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: '#F2F2F7' },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack>
    </>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const noopStorage = {
  getItem: (_key: string) => null as string | null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

// Supabase keys can exceed SecureStore's 2048-byte value limit, so we chunk
// large values into AsyncStorage and keep only a pointer in SecureStore.
const secureStorage = {
  getItem: async (key: string) => {
    const isLarge = await SecureStore.getItemAsync(`${key}_is_large`);
    if (isLarge === 'true') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (value.length > 1800) {
      await SecureStore.setItemAsync(`${key}_is_large`, 'true');
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.deleteItemAsync(`${key}_is_large`).catch(() => {});
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await SecureStore.deleteItemAsync(`${key}_is_large`).catch(() => {});
    await AsyncStorage.removeItem(key);
  },
};

const storage =
  Platform.OS === 'web'
    ? typeof window !== 'undefined'
      ? window.localStorage
      : noopStorage
    : secureStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

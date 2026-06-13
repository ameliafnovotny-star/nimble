import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';

interface Props {
  visible: boolean;
}

export function ResetPasswordModal({ visible }: Props) {
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const clearPasswordReset = useAuthStore((s) => s.clearPasswordReset);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const err = await updatePassword(password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setDone(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {done ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color={APP_COLORS.success} />
            <Text style={styles.successTitle}>Password updated!</Text>
            <Text style={styles.successSub}>You can now sign in with your new password.</Text>
            <TouchableOpacity style={styles.btn} onPress={clearPasswordReset} activeOpacity={0.85}>
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.sub}>Choose a new password for your account.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={APP_COLORS.textSecondary}
                secureTextEntry
                autoFocus
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                placeholderTextColor={APP_COLORS.textSecondary}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.btnText}>Update Password</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background, padding: 24 },
  header: { paddingTop: 20, paddingBottom: 32, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: APP_COLORS.text },
  sub: { fontSize: 15, color: APP_COLORS.textSecondary, lineHeight: 22 },
  form: { gap: 6 },
  label: {
    fontSize: 12, fontWeight: '700', color: APP_COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 4,
  },
  input: {
    backgroundColor: APP_COLORS.card, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: APP_COLORS.text,
  },
  errorText: { fontSize: 14, color: APP_COLORS.destructive, marginTop: 8 },
  btn: {
    backgroundColor: APP_COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: APP_COLORS.text },
  successSub: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useFitnessStore } from '../../store/useStore';
import { APP_COLORS } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user, loading, signIn, signUp, signOut, deleteAccount } = useAuthStore();
  const { syncToCloud, syncFromCloud, lastSyncedAt, syncError } = useFitnessStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSent, setSignUpSent] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const err = await signIn(email.trim(), password);
      if (err) {
        setError(err);
      } else {
        await syncFromCloud();
      }
    } else {
      const err = await signUp(email.trim(), password);
      if (err) {
        setError(err);
      } else {
        setSignUpSent(true);
      }
    }
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetError(null);
    setResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: 'nimble://reset-password',
    });
    setResetSending(false);
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    await syncToCloud();
    setSyncing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  if (signUpSent) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="mail-outline" size={56} color={APP_COLORS.primary} />
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to{'\n'}{email}.{'\n\n'}Click it, then come back to sign in.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { setSignUpSent(false); setMode('signin'); }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    const lastSync = lastSyncedAt
      ? new Date(lastSyncedAt).toLocaleString()
      : 'Not yet synced';

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={APP_COLORS.primary} />
            </View>
          </View>

          <Text style={styles.emailText}>{user.email}</Text>
          <Text style={styles.signedInLabel}>Signed in</Text>

          <View style={styles.card}>
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={styles.syncTitle}>Cloud Sync</Text>
                <Text style={styles.syncSub}>{lastSync}</Text>
              </View>
              <TouchableOpacity
                style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
                onPress={handleSyncNow}
                disabled={syncing}
                activeOpacity={0.8}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color={APP_COLORS.primary} />
                ) : (
                  <Ionicons name="sync-outline" size={18} color={APP_COLORS.primary} />
                )}
                <Text style={styles.syncBtnText}>{syncing ? 'Syncing…' : 'Sync Now'}</Text>
              </TouchableOpacity>
            </View>
            {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.infoText}>
              Your workouts and session history are automatically saved to the cloud every few seconds. Sign in on any device to access your data.
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={APP_COLORS.destructive} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'This will permanently delete your account and all your data. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                      const err = await deleteAccount();
                      if (err) Alert.alert('Error', err);
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="cloud-outline" size={52} color={APP_COLORS.primary} />
          <Text style={styles.title}>Account & Sync</Text>
          <Text style={styles.subtitle}>
            Back up your workouts and sync{'\n'}across all your devices.
          </Text>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
            onPress={() => { setMode('signin'); setError(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
            onPress={() => { setMode('signup'); setError(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={APP_COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={APP_COLORS.textSecondary}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity
              onPress={() => { setShowReset(true); setResetEmail(email); setResetSent(false); setResetError(null); }}
              activeOpacity={0.7}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Password reset modal */}
      {showReset && (
        <View style={styles.resetOverlay}>
          <View style={styles.resetSheet}>
            {resetSent ? (
              <>
                <Ionicons name="mail-outline" size={40} color={APP_COLORS.primary} />
                <Text style={styles.resetTitle}>Check your email</Text>
                <Text style={styles.resetSub}>
                  We sent a password reset link to{'\n'}{resetEmail}.
                </Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setShowReset(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.resetTitle}>Reset Password</Text>
                <Text style={styles.resetSub}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
                <TextInput
                  style={styles.input}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={APP_COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}
                <TouchableOpacity
                  style={[styles.primaryBtn, resetSending && styles.primaryBtnDisabled]}
                  onPress={handleResetPassword}
                  disabled={resetSending}
                  activeOpacity={0.8}
                >
                  {resetSending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowReset(false)} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  content: { padding: 24, paddingBottom: 48 },

  header: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  title: { fontSize: 24, fontWeight: '700', color: APP_COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: APP_COLORS.primary },
  modeTabText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.textSecondary },
  modeTabTextActive: { color: '#fff' },

  form: { gap: 6 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  errorText: { fontSize: 14, color: APP_COLORS.destructive, marginTop: 8, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { fontSize: 14, color: APP_COLORS.primary, fontWeight: '500' },

  resetOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  resetSheet: {
    backgroundColor: APP_COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 48,
    gap: 14,
    alignItems: 'center',
  },
  resetTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  resetSub: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },

  avatarContainer: { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: APP_COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  signedInLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    marginBottom: 24,
    marginTop: 4,
  },

  card: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncInfo: { flex: 1, marginRight: 12 },
  syncTitle: { fontSize: 15, fontWeight: '700', color: APP_COLORS.text },
  syncSub: { fontSize: 13, color: APP_COLORS.textSecondary, marginTop: 2 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: APP_COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.primary },
  infoText: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 21 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: APP_COLORS.destructive + '50',
    marginTop: 8,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.destructive },
  deleteBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  deleteText: { fontSize: 14, color: APP_COLORS.textSecondary, fontWeight: '500' },
});

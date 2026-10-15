import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { Feedback } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

function normalizeIdentity(value) {
  return value.includes('@') ? value.trim().toLowerCase() : value.replace(/[\s()-]/g, '');
}

function validIdentity(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[0-9]{7,15}$/.test(value);
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const name = fullName.trim();
    const normalizedIdentity = normalizeIdentity(identity.trim());
    if (name.length < 2 || name.length > 80) {
      setError('Enter your name using 2 to 80 characters.');
      return;
    }
    if (!validIdentity(normalizedIdentity)) {
      setError('Enter a valid email address or phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await register(name, normalizedIdentity, password, confirmation);
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.error?.message;
      setError(serverMessage || (
        requestError.response
          ? 'Unable to create your account. Please try again.'
          : 'Cannot reach the Roam API. Start the backend and check the API URL in mobile/.env.'
      ));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandR}>R</Text></View>
            <Text style={styles.brandName}>roam</Text>
          </View>
          <Text style={styles.kicker}>JOIN ROAM</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.copy}>A better ride is just around the corner.</Text>
          <View style={styles.form}>
            <FormField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" textContentType="name" maxLength={80} />
            <FormField label="Email or phone number" value={identity} onChangeText={setIdentity} placeholder="you@example.com or +15551234567" textContentType="username" style={styles.field} />
            <FormField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry textContentType="newPassword" style={styles.field} />
            <FormField label="Confirm password" value={confirmation} onChangeText={setConfirmation} placeholder="Enter your password again" secureTextEntry textContentType="newPassword" style={styles.field} />
            <Feedback message={error} />
            <PrimaryButton title="Create account" onPress={submit} loading={busy} style={styles.button} />
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 28, maxWidth: 560, width: '100%', alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  brandR: { color: colors.surface, fontSize: 23, fontWeight: '800' },
  brandName: { color: colors.primary, fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
  kicker: { color: colors.primary, fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginTop: 25 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', marginTop: 7 },
  copy: { color: colors.muted, fontSize: 15, marginTop: 8 },
  form: { marginTop: 25, padding: 18, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 7 },
  field: { marginTop: 15 },
  button: { marginTop: 12 },
  loginLink: { paddingVertical: 20 },
  loginText: { color: colors.muted, textAlign: 'center', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700' }
});

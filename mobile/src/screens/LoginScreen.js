import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { Feedback } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

function validIdentity(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[0-9]{7,15}$/.test(value.replace(/[\s()-]/g, ''));
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const normalized = identity.trim();
    if (!validIdentity(normalized) || password.length < 6) {
      setError('Enter a valid email or phone number and a password of at least 6 characters.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await login(normalized, password);
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.error?.message;
      setError(serverMessage || (
        requestError.response
          ? 'Sign in failed. Please check your details and try again.'
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
            <Text style={styles.brand}>roam</Text>
          </View>
          <Text style={styles.heading}>Your next ride starts here.</Text>
          <Text style={styles.subheading}>Sign in to find a motorbike nearby.</Text>
          <View style={styles.form}>
            <FormField label="Email or phone number" value={identity} onChangeText={setIdentity} placeholder="you@example.com" textContentType="username" />
            <FormField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry textContentType="password" style={styles.field} />
            <Feedback message={error} />
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
              <Text style={styles.link}>Forgot password?</Text>
            </TouchableOpacity>
            <PrimaryButton title="Sign in" onPress={submit} loading={busy} style={styles.button} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.register}>
            <Text style={styles.registerText}>New to Roam? <Text style={styles.link}>Create an account</Text></Text>
          </TouchableOpacity>
          <Text style={styles.footer}>Electric rides, made easy.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 36, maxWidth: 560, width: '100%', alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  brandR: { color: colors.surface, fontSize: 27, fontWeight: '800' },
  brand: { color: colors.primary, fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  heading: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 34, letterSpacing: -0.7 },
  subheading: { color: colors.muted, fontSize: 16, marginTop: 9 },
  form: { marginTop: 32, padding: 18, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 7 },
  field: { marginTop: 18 },
  forgot: { alignSelf: 'flex-end', paddingVertical: 12 },
  link: { color: colors.primary, fontWeight: '700' },
  button: { marginTop: 12 },
  register: { paddingVertical: 18 },
  registerText: { color: colors.muted, textAlign: 'center', fontSize: 14 },
  footer: { color: colors.muted, textAlign: 'center', marginTop: 38, fontSize: 13 }
});

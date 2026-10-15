import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { Feedback } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { authApi } from '../services/api';
import { colors } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [identity, setIdentity] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [validationError, setValidationError] = useState('');
  const request = useApi(authApi.forgotPassword);

  async function submit() {
    const value = identity.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[0-9]{7,15}$/.test(value.replace(/[\s()-]/g, ''));
    if (!valid) {
      setValidationError('Enter a valid email address or phone number.');
      request.setSuccess('');
      return;
    }
    setValidationError('');
    try {
      const result = await request.execute({ identity: value });
      request.setSuccess(result.message);
      setResetToken(result.resetToken || '');
    } catch {}
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>ACCOUNT HELP</Text>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.copy}>Enter the email or phone number associated with your Roam account.</Text>
          <View style={styles.form}>
            <FormField label="Email or phone number" value={identity} onChangeText={setIdentity} placeholder="you@example.com" />
            <Feedback message={validationError || request.error} />
            <Feedback message={request.success} success />
            {resetToken ? <Feedback message={`Assignment reset token: ${resetToken}`} success /> : null}
            <PrimaryButton title="Request reset token" onPress={submit} loading={request.loading} style={styles.button} />
            {resetToken ? <PrimaryButton title="Continue to reset" secondary onPress={() => navigation.navigate('ResetPassword', { token: resetToken })} style={styles.secondaryButton} /> : null}
            <Text onPress={() => navigation.goBack()} style={styles.back}>Back to sign in</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 26, maxWidth: 560, width: '100%', alignSelf: 'center' },
  kicker: { color: colors.primary, fontSize: 12, letterSpacing: 1.5, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 12 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 10 },
  form: { marginTop: 30, padding: 18, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 7 },
  button: { marginTop: 16 },
  secondaryButton: { marginTop: 12 },
  back: { color: colors.primary, textAlign: 'center', padding: 18, fontWeight: '700' }
});

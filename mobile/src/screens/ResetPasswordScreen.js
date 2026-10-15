import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { Feedback } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { authApi } from '../services/api';
import { colors } from '../theme';

export default function ResetPasswordScreen({ navigation, route }) {
  const [token, setToken] = useState(route.params?.token || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [validationError, setValidationError] = useState('');
  const request = useApi(authApi.resetPassword);

  async function submit() {
    if (token.trim().length < 32 || password.length < 6 || password !== confirmation) {
      setValidationError(password !== confirmation && confirmation
        ? 'The passwords do not match.'
        : 'Enter a valid reset token and a password of at least 6 characters.');
      request.setSuccess('');
      return;
    }
    setValidationError('');
    try {
      await request.execute({ token: token.trim(), password, confirmPassword: confirmation });
      navigation.popToTop();
    } catch {}
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>SECURE YOUR ACCOUNT</Text>
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.copy}>Your reset token is valid for 20 minutes and can be used once.</Text>
          <View style={styles.form}>
            <FormField label="Reset token" value={token} onChangeText={setToken} placeholder="Paste your reset token" autoCapitalize="none" />
            <FormField label="New password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry style={styles.field} />
            <FormField label="Confirm password" value={confirmation} onChangeText={setConfirmation} placeholder="Enter it again" secureTextEntry style={styles.field} />
            <Feedback message={validationError || request.error} />
            <PrimaryButton title="Update password" onPress={submit} loading={request.loading} style={styles.button} />
            <Text onPress={() => navigation.goBack()} style={styles.back}>Back</Text>
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
  field: { marginTop: 18 },
  button: { marginTop: 14 },
  back: { color: colors.primary, textAlign: 'center', padding: 18, fontWeight: '700' }
});

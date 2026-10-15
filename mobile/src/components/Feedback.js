import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function LoadingView({ message = 'Loading...' }) {
  return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>{message}</Text></View>;
}

export function Feedback({ message, success = false }) {
  if (!message) return null;
  return <Text accessibilityRole="alert" style={[styles.feedback, success ? styles.success : styles.failure]}>{message}</Text>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  muted: { color: colors.muted, fontSize: 15 },
  feedback: { padding: 12, borderRadius: 12, overflow: 'hidden', marginVertical: 8, fontSize: 14 },
  success: { color: colors.green, backgroundColor: colors.greenSoft },
  failure: { color: colors.red, backgroundColor: colors.redSoft }
});

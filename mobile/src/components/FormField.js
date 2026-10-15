import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export default function FormField({ label, error, style, ...props }) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, minHeight: 52, fontSize: 16 },
  inputError: { borderColor: colors.red },
  error: { color: colors.red, marginTop: 5, fontSize: 13 }
});

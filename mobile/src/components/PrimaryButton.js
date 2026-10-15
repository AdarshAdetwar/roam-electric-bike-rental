import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

export default function PrimaryButton({ title, onPress, disabled = false, loading = false, secondary = false, danger = false, success = false, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        danger && styles.danger,
        success && styles.success,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={secondary || danger || success ? colors.primary : colors.surface} /> : (
        <Text style={[styles.label, secondary && styles.secondaryLabel, danger && styles.dangerLabel, success && styles.successLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingHorizontal: 18, elevation: 3, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.redSoft, borderWidth: 1, borderColor: '#F3D3D0' },
  success: { backgroundColor: '#E5F2FA', borderWidth: 1, borderColor: '#D5E5F0' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  label: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  secondaryLabel: { color: colors.primary },
  dangerLabel: { color: colors.red },
  successLabel: { color: colors.primary, fontWeight: '800' }
});

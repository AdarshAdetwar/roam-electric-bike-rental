import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const categoryBackgrounds = {
  City: colors.sky,
  Pro: colors.lavender,
  Cargo: colors.mint
};

export function motorbikeBackground(category) {
  return categoryBackgrounds[category] || colors.peach;
}

export default function MotorbikeIllustration({
  color = '#142F55',
  size = 'medium'
}) {
  const large = size === 'large';
  return (
    <View style={[styles.frame, large ? styles.largeFrame : styles.mediumFrame]}>
      <MaterialCommunityIcons
        name="motorbike"
        size={large ? 112 : 88}
        color={color}
        accessibilityLabel="Electric motorbike"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  mediumFrame: { width: 154, height: 100 },
  largeFrame: { width: 190, height: 128 }
});

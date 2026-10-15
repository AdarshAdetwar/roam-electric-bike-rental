import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const statusPresentation = {
  available: { label: 'Available', color: colors.green, background: colors.greenSoft },
  'low-battery': { label: 'Low battery', color: colors.amber, background: colors.amberSoft },
  'in-use': { label: 'In use', color: colors.muted, background: '#EEF1EF' }
};

export default function MotorbikeCard({ motorbike, onRent }) {
  const status = statusPresentation[motorbike.status] || statusPresentation.available;

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.identity}>
          <View style={styles.iconTile}>
            <MaterialCommunityIcons name="motorbike" size={27} color={colors.primary} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{motorbike.name}</Text>
            <Text style={styles.category}>{motorbike.category}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: status.background }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={colors.muted} />
        <Text style={styles.location} numberOfLines={1}>{motorbike.locationText}</Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.batteryRow}>
          <Ionicons name="battery-half-outline" size={18} color={colors.primary} />
          <Text style={styles.metricLabel}>Battery</Text>
          <Text style={styles.metricValue}>{motorbike.batteryPercentage}%</Text>
        </View>
        <View style={styles.rateRow}>
          <Text style={styles.rate}>${Number(motorbike.hourlyRate).toFixed(2)}</Text>
          <Text style={styles.rateUnit}>/ hour</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rent ${motorbike.name}`}
        onPress={onRent}
        disabled={motorbike.status !== 'available'}
        style={({ pressed }) => [
          styles.select,
          motorbike.status !== 'available' && styles.selectDisabled,
          pressed && motorbike.status === 'available' && styles.selectPressed
        ]}
      >
        <Text style={[styles.selectText, motorbike.status !== 'available' && styles.selectDisabledText]}>
          {motorbike.status === 'available' ? 'Rent this motorbike' : 'Unavailable'}
        </Text>
        {motorbike.status === 'available'
          ? <Ionicons name="chevron-forward" size={17} color={colors.surface} style={styles.selectArrow} />
          : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: 22, borderColor: colors.border, borderWidth: 1, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 7 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  iconTile: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  category: { color: colors.muted, fontSize: 13, marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 15 },
  location: { color: colors.muted, fontSize: 13, flex: 1 },
  metrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, marginBottom: 14 },
  batteryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricLabel: { color: colors.muted, fontSize: 13 },
  metricValue: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rate: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  rateUnit: { color: colors.muted, fontSize: 12 },
  select: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary, paddingHorizontal: 12 },
  selectPressed: { opacity: 0.82 },
  selectDisabled: { backgroundColor: '#EEF1EF' },
  selectText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  selectDisabledText: { color: colors.muted },
  selectArrow: { position: 'absolute', right: 12 }
});

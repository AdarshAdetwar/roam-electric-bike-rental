import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import MotorbikeIllustration, { motorbikeBackground } from '../components/MotorbikeIllustration';
import { Feedback, LoadingView } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { issueApi, rentalApi } from '../services/api';
import { colors } from '../theme';

function formatRemaining(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ActiveRentalScreen({ navigation }) {
  const active = useApi(rentalApi.active);
  const finish = useApi(rentalApi.end);
  const report = useApi(issueApi.report);
  const [now, setNow] = useState(Date.now());
  const [issueModal, setIssueModal] = useState(false);
  const [description, setDescription] = useState('');
  const expiryCheck = useRef('');
  const rental = active.data?.rental || null;
  const remaining = useMemo(() => rental ? new Date(rental.endsAt).getTime() - now : 0, [rental, now]);

  const load = useCallback(async () => {
    try { await active.execute(); } catch {}
  }, [active.execute]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (rental && remaining <= 0 && expiryCheck.current !== rental.endsAt) {
      expiryCheck.current = rental.endsAt;
      load();
    }
  }, [rental, remaining, load]);

  async function endRide() {
    if (!rental) return;
    Alert.alert('End this ride?', 'Your motorbike will be made available to other riders.', [
      { text: 'Keep riding', style: 'cancel' },
      {
        text: 'End ride',
        style: 'destructive',
        onPress: async () => {
          try {
            await finish.execute(rental.id);
            await load();
            Alert.alert('Ride complete', 'Your ride has ended.');
          } catch {}
        }
      }
    ]);
  }

  async function submitIssue() {
    if (!rental || description.trim().length < 3) return;
    try {
      await report.execute({ rentalId: rental.id, description: description.trim() });
      setDescription('');
      setIssueModal(false);
      report.setSuccess('Issue report submitted.');
    } catch {}
  }

  if (active.loading && !active.data) {
    return <SafeAreaView style={styles.safeArea}><LoadingView message="Checking your ride..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>YOUR RENTAL</Text>
            <Text style={styles.heading}>Your rental</Text>
          </View>
          {rental ? (
            <View style={styles.liveLabel}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}
        </View>
        <Feedback message={active.error || finish.error || report.error} />
        <Feedback message={report.success} success />
        {rental ? (
          <>
            <View style={styles.motorbikeCard}>
              <View style={styles.motorbikeArtwork}>
                <Text style={styles.artworkLabel}>ROAM / {rental.category.toUpperCase()}</Text>
                <MotorbikeIllustration size="large" />
                <Text style={styles.artworkMark}>{rental.category.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.motorbikeDetails}>
                <Text style={styles.name}>{rental.name}</Text>
                <Text style={styles.category}>Electric motorbike</Text>
                <View style={styles.metrics}>
                  <Metric label="BATTERY" value={`${rental.batteryPercentage}%`} />
                  <Metric label="RATE" value={`$${Number(rental.hourlyRate).toFixed(2)} / hr`} />
                  <Metric label="STATUS" value="On ride" />
                </View>
                <InfoLine label="Pickup" value={rental.locationText} />
              </View>
            </View>
            <View style={styles.timerCard}>
              <View style={styles.timerHeader}>
                <Text style={styles.timerLabel}>{remaining > 0 ? 'TIME REMAINING' : 'RIDE EXPIRED'}</Text>
                {remaining > 0 ? (
                  <View style={styles.timerLive}>
                    <View style={styles.timerLiveDot} />
                    <Text style={styles.timerLiveText}>LIVE</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.timer, remaining <= 0 && styles.timerExpired]}>{formatRemaining(remaining)}</Text>
              <View style={styles.units}>
                <Text style={styles.unit}>HOURS</Text>
                <Text style={styles.unit}>MINUTES</Text>
                <Text style={styles.unit}>SECONDS</Text>
              </View>
              <View style={styles.timerFooter}>
                <Text style={styles.endsAt}>STARTED {new Date(rental.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                <Text style={styles.endsAt}>1 hour included</Text>
              </View>
            </View>
            <PrimaryButton title="End this ride" onPress={endRide} loading={finish.loading} success style={styles.button} />
            <PrimaryButton
              title="Report an issue"
              secondary
              onPress={() => setIssueModal(true)}
              style={styles.secondary}
            />
            <Text style={styles.rideNote}>Please park in a designated area when your ride is complete.</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="time-outline" size={31} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>No active ride</Text>
            <Text style={styles.emptyText}>Choose an available motorbike and your ride details will appear here.</Text>
            <PrimaryButton title="Explore motorbikes" onPress={() => navigation.navigate('Motorbikes')} style={styles.button} />
          </View>
        )}
        <Modal visible={issueModal} transparent animationType="fade" onRequestClose={() => setIssueModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Report an issue</Text>
              <Text style={styles.modalCopy}>Tell us what happened with {rental?.name}.</Text>
              <FormField label="Issue description" value={description} onChangeText={setDescription} placeholder="Describe the issue (3–500 characters)" multiline numberOfLines={4} maxLength={500} textAlignVertical="top" style={styles.issueField} />
              <Feedback message={report.error} />
              <PrimaryButton title="Submit report" onPress={submitIssue} loading={report.loading} disabled={description.trim().length < 3} />
              <Text onPress={() => setIssueModal(false)} style={styles.cancel}>Cancel</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoLine({ label, value }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
      <View style={styles.locationValue}>
        <Ionicons name="location" size={15} color={colors.green} />
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 19, paddingBottom: 24, backgroundColor: colors.background, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  kicker: { color: colors.primaryDark, fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  liveLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  liveText: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  motorbikeCard: { backgroundColor: colors.surface, borderRadius: 22, borderColor: colors.border, borderWidth: 1, padding: 11, overflow: 'hidden', elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  motorbikeArtwork: { height: 170, borderRadius: 17, backgroundColor: colors.sky, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  artworkLabel: { position: 'absolute', top: 13, left: 13, color: colors.primaryDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  artworkMark: { position: 'absolute', right: 12, bottom: -12, color: colors.primary, fontSize: 70, fontWeight: '800', opacity: 0.95 },
  motorbikeDetails: { paddingHorizontal: 5, paddingTop: 14 },
  name: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  category: { color: colors.muted, fontSize: 13, marginTop: 3 },
  metrics: { flexDirection: 'row', marginTop: 17, paddingTop: 13, paddingBottom: 11, borderTopWidth: 1, borderColor: colors.border },
  metric: { flex: 1, paddingHorizontal: 9, borderRightWidth: 1, borderColor: colors.border },
  metricLabel: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  metricValue: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 5 },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, gap: 14, borderTopWidth: 1, borderColor: colors.border },
  infoLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  locationValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, flex: 1 },
  infoValue: { color: colors.ink, fontWeight: '500', fontSize: 12, textAlign: 'right', flexShrink: 1 },
  timerCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 22, paddingHorizontal: 19, paddingTop: 18, paddingBottom: 15, marginTop: 14, elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  timerLive: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, backgroundColor: colors.greenSoft, paddingHorizontal: 9, paddingVertical: 5 },
  timerLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0FA574' },
  timerLiveText: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  timer: { color: colors.primary, textAlign: 'center', fontSize: 43, fontWeight: '800', letterSpacing: 2, marginTop: 16, fontVariant: ['tabular-nums'] },
  timerExpired: { color: colors.red, fontSize: 35 },
  units: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: 1 },
  unit: { color: colors.primaryDark, fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
  timerFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, marginTop: 17, paddingTop: 12 },
  endsAt: { color: colors.muted, fontSize: 11 },
  button: { marginTop: 16, minHeight: 54 },
  secondary: { marginTop: 10, minHeight: 52, backgroundColor: colors.blueSoft, borderWidth: 0 },
  rideNote: { color: '#52647A', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 15, paddingHorizontal: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: 360 },
  emptyIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 18 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(17, 34, 55, 0.45)' },
  modal: { backgroundColor: colors.background, borderRadius: 22, padding: 22 },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  modalCopy: { color: colors.muted, fontSize: 15, marginTop: 8, marginBottom: 18 },
  issueField: { marginBottom: 16 },
  cancel: { textAlign: 'center', color: colors.primary, padding: 14, fontWeight: '700' }
});

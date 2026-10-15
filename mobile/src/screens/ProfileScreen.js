import React, { useCallback } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { Feedback, LoadingView } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { profileApi, rentalApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function ProfileScreen() {
  const profile = useApi(profileApi.get);
  const history = useApi(rentalApi.history);
  const { logout } = useAuth();

  const loadProfile = useCallback(async () => {
    try {
      await profile.execute();
    } catch {}
  }, [profile.execute]);

  const loadHistory = useCallback(async () => {
    try {
      await history.execute();
    } catch {}
  }, [history.execute]);

  useFocusEffect(useCallback(() => {
    loadProfile();
    loadHistory();
  }, [loadHistory, loadProfile]));

  if ((profile.loading && !profile.data) && (history.loading && !history.data)) {
    return <SafeAreaView style={styles.safeArea}><LoadingView message="Loading your profile..." /></SafeAreaView>;
  }

  const user = profile.data?.user;
  const initial = user?.fullName?.trim().charAt(0).toUpperCase() || 'R';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>YOUR ACCOUNT</Text>
        <Text style={styles.heading}>Profile</Text>
        <Feedback message={profile.error} />
        {user ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
              <Text style={styles.name}>{user.fullName}</Text>
              <Text style={styles.memberSince}>
                Member since {new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Account details</Text>
              {user.email ? <ProfileRow label="Email" value={user.email} /> : null}
              {user.phone ? <ProfileRow label="Phone" value={user.phone} /> : null}
            </View>
          </>
        ) : null}
        <View style={styles.historySection}>
          <View style={styles.historyHeading}>
            <View>
              <Text style={styles.sectionTitle}>Rental history</Text>
              <Text style={styles.historySubtitle}>Your completed motorbike rides</Text>
            </View>
            {history.data?.rentals?.length ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{history.data.rentals.length}</Text>
              </View>
            ) : null}
          </View>
          {history.error ? <Feedback message={history.error} /> : null}
          {history.loading && !history.data ? (
            <LoadingView message="Loading your rentals..." />
          ) : history.data?.rentals?.length ? (
            history.data.rentals.map((rental) => (
              <RentalHistoryCard key={rental.id} rental={rental} />
            ))
          ) : !history.error ? (
            <View style={styles.emptyHistory}>
              <MaterialCommunityIcons name="motorbike" size={30} color={colors.primary} />
              <Text style={styles.emptyHistoryTitle}>No completed rides yet</Text>
              <Text style={styles.emptyHistoryText}>Your finished rentals will appear here.</Text>
            </View>
          ) : null}
          {history.error ? (
            <PrimaryButton title="Retry rental history" onPress={loadHistory} loading={history.loading} secondary style={styles.retry} />
          ) : null}
        </View>
        {profile.error ? (
          <PrimaryButton title="Try again" onPress={loadProfile} loading={profile.loading} secondary style={styles.retry} />
        ) : null}
        <PrimaryButton title="Sign out" onPress={logout} secondary style={styles.signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RentalHistoryCard({ rental }) {
  const completedAt = rental.endedAt || rental.endsAt;
  const date = new Date(rental.startsAt);
  const endDate = new Date(completedAt);
  const statusLabel = rental.status === 'expired' ? 'Expired' : 'Completed';
  const statusStyle = rental.status === 'expired' ? styles.expiredBadge : styles.completedBadge;

  return (
    <View style={styles.rentalCard}>
      <View style={styles.rentalHeader}>
        <View style={styles.rentalIdentity}>
          <View style={styles.rentalIcon}>
            <MaterialCommunityIcons name="motorbike" size={23} color={colors.primary} />
          </View>
          <View style={styles.rentalNameBlock}>
            <Text style={styles.rentalName} numberOfLines={1}>{rental.name}</Text>
            <Text style={styles.rentalCategory}>{rental.category} motorbike</Text>
          </View>
        </View>
        <View style={[styles.rentalStatus, statusStyle]}>
          <Text style={[styles.rentalStatusText, rental.status === 'expired' && styles.expiredText]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.rentalLocation}>
        <Ionicons name="location-outline" size={15} color={colors.muted} />
        <Text style={styles.rentalDetailText} numberOfLines={1}>{rental.locationText}</Text>
      </View>
      <View style={styles.rentalFooter}>
        <View style={styles.rentalDate}>
          <Ionicons name="calendar-outline" size={15} color={colors.primary} />
          <Text style={styles.rentalDetailText}>
            {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <Text style={styles.rentalRate}>${Number(rental.hourlyRate).toFixed(2)} / hr</Text>
      </View>
      <Text style={styles.rentalTime}>
        {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        {' - '}
        {endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        {'  ·  Battery '}
        {rental.batteryPercentage}%
      </Text>
    </View>
  );
}

function ProfileRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
  kicker: { color: colors.primary, fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '800', marginTop: 5, marginBottom: 20 },
  profileCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 24, alignItems: 'center', elevation: 3, shadowColor: '#17365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 7 },
  avatar: { width: 76, height: 76, borderRadius: 26, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 33, fontWeight: '800' },
  name: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 14 },
  memberSince: { color: colors.muted, fontSize: 13, marginTop: 6 },
  detailsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 17, marginTop: 15, elevation: 2, shadowColor: '#17365D', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  historySection: { marginTop: 22 },
  historyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  historySubtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  countBadge: { minWidth: 30, height: 30, paddingHorizontal: 8, borderRadius: 15, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  countText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  rentalCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 19, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#17365D', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
  rentalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rentalIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  rentalIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rentalNameBlock: { flex: 1, minWidth: 0 },
  rentalName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  rentalCategory: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rentalStatus: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  completedBadge: { backgroundColor: colors.greenSoft },
  expiredBadge: { backgroundColor: colors.amberSoft },
  rentalStatusText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  expiredText: { color: colors.amber },
  rentalLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  rentalDetailText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  rentalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  rentalDate: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rentalRate: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  rentalTime: { color: colors.muted, fontSize: 11, marginTop: 8 },
  emptyHistory: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 19, padding: 22 },
  emptyHistoryTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptyHistoryText: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14 },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.ink, fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  retry: { marginTop: 18 },
  signOut: { marginTop: 18 }
});

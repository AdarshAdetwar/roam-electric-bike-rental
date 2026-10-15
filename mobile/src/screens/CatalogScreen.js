import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MotorbikeCard from '../components/MotorbikeCard';
import MotorbikeIllustration from '../components/MotorbikeIllustration';
import PrimaryButton from '../components/PrimaryButton';
import { Feedback, LoadingView } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { assetApi, rentalApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function CatalogScreen({ navigation }) {
  const catalog = useApi(assetApi.list);
  const active = useApi(rentalApi.active);
  const startRental = useApi(rentalApi.start);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const load = useCallback(async () => {
    try {
      await Promise.all([catalog.execute(), active.execute()]);
    } catch {}
  }, [catalog.execute, active.execute]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function rent(motorbike) {
    if (active.data?.rental) {
      Alert.alert('You already have a ride', 'End your current ride before renting another motorbike.');
      return;
    }
    Alert.alert(
      'Start your ride?',
      `Rent ${motorbike.name} for one hour at $${Number(motorbike.hourlyRate).toFixed(2)} per hour?`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Start ride',
          onPress: async () => {
            try {
              await startRental.execute(motorbike.id);
              await active.execute();
              navigation.navigate('Ride');
            } catch {}
          }
        }
      ]
    );
  }

  if (catalog.loading && !catalog.data) {
    return <SafeAreaView style={styles.safeArea}><LoadingView message="Finding motorbikes nearby..." /></SafeAreaView>;
  }

  const motorbikes = catalog.data?.assets || [];
  const visibleMotorbikes = selectedCategory === 'All'
    ? motorbikes
    : motorbikes.filter((motorbike) => motorbike.category.toLowerCase() === selectedCategory.toLowerCase());
  const readyCount = motorbikes.filter((motorbike) => motorbike.status === 'available').length;
  const initial = user?.fullName?.trim().charAt(0).toUpperCase() || 'R';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={visibleMotorbikes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MotorbikeCard motorbike={item} onRent={() => rent(item)} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brand}>
                <View style={styles.brandMark}><Text style={styles.brandMarkText}>R</Text></View>
                <Text style={styles.brandName}>roam</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                onPress={() => navigation.navigate('Profile')}
                style={styles.avatarButton}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
            </View>
            <Text style={styles.greeting}>Ready for a ride?</Text>
            <Text style={styles.subtitle}>The city is yours to explore.</Text>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>YOUR NEXT RIDE</Text>
                <Text style={styles.heroTitle}>Good things are in motion.</Text>
                <Text style={styles.heroSubtitle}>Find a ride nearby and go.</Text>
              </View>
              <View pointerEvents="none" style={styles.heroArt}>
                <MotorbikeIllustration color={colors.primary} size="large" />
              </View>
            </View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Nearby rides</Text>
                <Text style={styles.sectionSubtitle}>Pick one and make it yours.</Text>
              </View>
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>{readyCount} ready</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilters}
              accessibilityLabel="Filter motorbikes by category"
            >
              {['All', 'City', 'Cargo', 'Pro'].map((category) => {
                const selected = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Feedback message={catalog.error || startRental.error || active.error} />
            {active.data?.rental ? (
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Ride')} style={styles.activeNotice}>
                <Ionicons name="time-outline" size={19} color={colors.primary} />
                <Text style={styles.activeNoticeText}>You have a ride in progress</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={!catalog.loading ? (
          <View style={styles.empty}>
            {catalog.error
              ? <Ionicons name="cloud-offline-outline" size={34} color={colors.muted} />
              : <MaterialCommunityIcons name="motorbike-electric" size={34} color={colors.muted} />}
            <Text style={styles.emptyTitle}>
              {catalog.error ? 'We could not load motorbikes' : `No ${selectedCategory === 'All' ? '' : `${selectedCategory.toLowerCase()} `}motorbikes found`}
            </Text>
            <Text style={styles.sectionSubtitle}>{catalog.error ? 'Check your connection and try again.' : 'Choose another category or pull down to refresh.'}</Text>
            {catalog.error ? <PrimaryButton title="Try again" onPress={refresh} secondary style={styles.retry} /> : null}
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 21 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.surface, fontSize: 18, fontStyle: 'italic', fontWeight: '800' },
  brandName: { color: colors.primary, fontSize: 21, fontWeight: '800', letterSpacing: -0.8 },
  avatarButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  greeting: { color: colors.ink, fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  hero: { minHeight: 174, overflow: 'hidden', borderRadius: 23, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: 20, padding: 20, justifyContent: 'center', elevation: 4, shadowColor: '#17365D', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.13, shadowRadius: 9 },
  heroCopy: { width: '68%', zIndex: 1 },
  heroEyebrow: { color: colors.muted, fontSize: 9, letterSpacing: 1.7, fontWeight: '800' },
  heroTitle: { color: colors.primaryDark, fontSize: 22, lineHeight: 27, fontWeight: '800', marginTop: 9, letterSpacing: -0.5 },
  heroSubtitle: { color: colors.ink, fontSize: 12, marginTop: 8 },
  heroArt: { position: 'absolute', right: -26, bottom: 10, opacity: 0.94, transform: [{ rotate: '-5deg' }] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  categoryFilters: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 14 },
  categoryChip: { minHeight: 34, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 18, backgroundColor: colors.surface },
  categoryChipSelected: { backgroundColor: colors.primary },
  categoryChipText: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  categoryChipTextSelected: { color: colors.surface },
  readyBadge: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.blueSoft },
  readyText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  activeNotice: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.blueSoft, marginBottom: 12 },
  activeNoticeText: { color: colors.primary, fontSize: 13, fontWeight: '700', flex: 1 },
  empty: { alignItems: 'center', paddingTop: 36, paddingHorizontal: 20, gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 4 },
  retry: { minWidth: 150, marginTop: 10 }
});

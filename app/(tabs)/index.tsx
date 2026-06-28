import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { C, GC } from '../../src/constants/theme';
import {
  FEED,
  WEEKLY,
  WEEKS,
  W_DATA,
  getWeekStats,
  getGreeting,
  fmtDate,
  fmtDur,
  cleanName,
  refreshSessionsFromServer,
  refreshDerivedData,
} from '../../src/lib/store';
import { EX_GROUP, PLANS } from '../../src/constants/data';
import { GlassCard, Ring } from '../../src/components/shared/GlassCard';

function StatBadge({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function FeedCard({ session, onPress }: { session: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.feedCardHeader}>
        <View>
          <Text style={styles.feedDate}>{fmtDate(session.date)}</Text>
          <Text style={styles.feedName}>{cleanName(session.name)}</Text>
        </View>
        <Text style={{ color: C.sub, fontSize: 18 }}>›</Text>
      </View>
      <View style={styles.feedBadges}>
        {[
          { l: 'Tempo', v: session.duration ? fmtDur(session.duration) : fmtDur(Math.round(session.totalSets * 3)) },
          { l: 'Volume', v: session.totalVol + 't' },
          { l: 'Séries', v: session.totalSets },
        ].map((s) => (
          <View key={s.l} style={styles.feedBadge}>
            <Text style={styles.feedBadgeText}>{s.v} {s.l}</Text>
          </View>
        ))}
      </View>
      <View style={styles.feedExList}>
        {session.exercises.slice(0, 3).map((ex: any, i: number) => {
          const gc = GC[EX_GROUP[ex.name]] || C.blueL;
          return (
            <View key={i} style={styles.feedExRow}>
              <View style={[styles.feedExDot, { backgroundColor: gc }]} />
              <Text style={styles.feedExName} numberOfLines={1}>{ex.sets} sets · {ex.name}</Text>
              <Text style={styles.feedExWeight}>{ex.bestW > 0 ? ex.bestW + 'kg' : ''}</Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [, forceUpdate] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshDerivedData();
      forceUpdate((n) => n + 1);
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await refreshSessionsFromServer();
    forceUpdate((n) => n + 1);
    setRefreshing(false);
  }

  const weekStats = getWeekStats();
  const recentSessions = FEED.slice(0, 10);
  const lastSession = FEED[0];

  // Week volume progress
  const curWeek = WEEKS[WEEKS.length - 1];
  const prevWeek = WEEKS[WEEKS.length - 2];
  const curVol = WEEKLY[curWeek]?.vol || 0;
  const prevVol = WEEKLY[prevWeek]?.vol || 1;
  const volPct = Math.min(100, Math.round((curVol / (prevVol || 1)) * 100));

  const currentWeight = W_DATA.length > 0 ? W_DATA[W_DATA.length - 1] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blueL} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, Bruno</Text>
            <Text style={styles.headerSub}>
              {weekStats.sessions > 0
                ? `${weekStats.sessions} treino${weekStats.sessions > 1 ? 's' : ''} essa semana`
                : 'Pronto para treinar?'}
            </Text>
          </View>
          <Text style={{ fontSize: 28 }}>💪</Text>
        </View>

        {/* Week Summary */}
        <GlassCard style={styles.weekCard}>
          <Text style={styles.sectionLabel}>ESTA SEMANA</Text>
          <View style={styles.weekStats}>
            <StatBadge label="Treinos" value={weekStats.sessions} color={C.blueXL} />
            <StatBadge label="Volume" value={weekStats.vol + 't'} color={C.mint} />
            <StatBadge label="Séries" value={weekStats.sets} />
            {weekStats.avgRpe && <StatBadge label="RPE Médio" value={weekStats.avgRpe} color={C.amber} />}
          </View>

          {/* Volume progress bar */}
          <View style={styles.volProgress}>
            <View style={styles.volProgressLabel}>
              <Text style={styles.volLabel}>Volume vs semana anterior</Text>
              <Text style={[styles.volPct, { color: volPct >= 100 ? C.mint : C.amber }]}>{volPct}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(volPct, 100)}%`, backgroundColor: volPct >= 100 ? C.mint : C.blueL }]} />
            </View>
          </View>
        </GlassCard>

        {/* Start Workout */}
        <Text style={styles.sectionTitle}>COMEÇAR TREINO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, { borderColor: plan.color + '66' }]}
              onPress={() => router.push(`/treino/${plan.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.planDot, { backgroundColor: plan.color }]} />
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={styles.planExCount}>{plan.exercises.length} exercícios</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weight + Last session */}
        <View style={styles.row}>
          {currentWeight && (
            <GlassCard style={[styles.miniCard, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.miniLabel}>PESO ATUAL</Text>
              <Text style={styles.miniValue}>{currentWeight}<Text style={styles.miniUnit}>kg</Text></Text>
            </GlassCard>
          )}
          {lastSession && (
            <GlassCard style={[styles.miniCard, { flex: 1 }]}>
              <Text style={styles.miniLabel}>ÚLTIMO TREINO</Text>
              <Text style={styles.miniValue} numberOfLines={1}>{cleanName(lastSession.name)}</Text>
              <Text style={styles.miniUnit}>{fmtDate(lastSession.date)}</Text>
            </GlassCard>
          )}
        </View>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>HISTÓRICO</Text>
            {recentSessions.map((session) => (
              <FeedCard
                key={session.id}
                session={session}
                onPress={() => {/* TODO: navigate to detail */}}
              />
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  weekCard: { padding: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 1,
    marginBottom: 12,
  },
  weekStats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBadge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  statLabel: { fontSize: 9, color: C.sub, fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: C.text },
  volProgress: {},
  volProgressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  volLabel: { fontSize: 11, color: C.sub },
  volPct: { fontSize: 11, fontWeight: '700' },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
    width: 140,
  },
  planDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  planName: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 2 },
  planLabel: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 6 },
  planExCount: { fontSize: 11, color: C.muted },
  row: { flexDirection: 'row', marginBottom: 20 },
  miniCard: { padding: 12 },
  miniLabel: { fontSize: 9, color: C.sub, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  miniValue: { fontSize: 20, fontWeight: '800', color: C.text },
  miniUnit: { fontSize: 12, color: C.sub },
  feedCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    marginBottom: 10,
    padding: 16,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedDate: { fontSize: 10, fontWeight: '700', color: C.blueXL, letterSpacing: 1, marginBottom: 2 },
  feedName: { fontSize: 17, fontWeight: '800', color: C.text },
  feedBadges: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  feedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  feedBadgeText: { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 0.5 },
  feedExList: { borderTopWidth: 1, borderTopColor: C.border + '33', paddingTop: 8 },
  feedExRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  feedExDot: { width: 6, height: 6, borderRadius: 3 },
  feedExName: { flex: 1, fontSize: 12, color: '#CBD5E1', fontWeight: '500' },
  feedExWeight: { fontSize: 11, color: C.sub, fontWeight: '600' },
});

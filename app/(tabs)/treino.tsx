import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { C, GC } from '../../src/constants/theme';
import { PLANS, ALL_EXERCISES, EX_GROUP } from '../../src/constants/data';
import { FEED, fmtDate, cleanName, refreshDerivedData } from '../../src/lib/store';
import { loadRoutines } from '../../src/lib/store';

export default function TreinoTab() {
  const [, forceUpdate] = useState(0);
  const routines = loadRoutines();

  useFocusEffect(
    useCallback(() => {
      refreshDerivedData();
      forceUpdate((n) => n + 1);
    }, [])
  );

  const lastSessionByPlan: Record<string, any> = {};
  FEED.forEach((s) => {
    const matchedPlan = PLANS.find((p) =>
      p.exercises.some((pe) => s.exercises?.some((se) => se.name === pe.name))
    );
    if (matchedPlan && !lastSessionByPlan[matchedPlan.id]) {
      lastSessionByPlan[matchedPlan.id] = s;
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Treino</Text>
          <TouchableOpacity
            style={styles.exercBtn}
            onPress={() => router.push('/exercicios')}
          >
            <Text style={styles.exercBtnText}>🏋️ Exercícios</Text>
          </TouchableOpacity>
        </View>

        {/* Default Plans */}
        <Text style={styles.sectionLabel}>PLANO 5 DIAS</Text>
        {PLANS.map((plan) => {
          const last = lastSessionByPlan[plan.id];
          return (
            <TouchableOpacity
              key={plan.id}
              style={styles.planCard}
              onPress={() => router.push(`/treino/${plan.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.planColorBar, { backgroundColor: plan.color }]} />
              <View style={styles.planInfo}>
                <View>
                  <Text style={styles.planDay}>{plan.name}</Text>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                </View>
                <View>
                  <Text style={styles.planMeta}>{plan.exercises.length} exercícios</Text>
                  {last && (
                    <Text style={styles.planLast}>Último: {fmtDate(last.date)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.planExTags}>
                {plan.exercises.slice(0, 3).map((ex) => {
                  const gc = GC[EX_GROUP[ex.name]] || C.blueL;
                  return (
                    <View key={ex.name} style={[styles.exTag, { borderColor: gc + '44', backgroundColor: gc + '18' }]}>
                      <Text style={[styles.exTagText, { color: gc }]} numberOfLines={1}>
                        {ex.name.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.startBtn}>Iniciar →</Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom Routines */}
        {routines.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>MINHAS ROTINAS</Text>
            {routines.map((r: any) => (
              <TouchableOpacity
                key={r.id}
                style={styles.routineCard}
                onPress={() => router.push(`/treino/routine/${r.id}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.routineDot, { backgroundColor: r.color || C.blueL }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  {r.label && <Text style={styles.routineLabel}>{r.label}</Text>}
                </View>
                <Text style={{ color: C.sub, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Muscle groups quick access */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>POR MÚSCULO</Text>
        <View style={styles.muscleGrid}>
          {Object.entries(ALL_EXERCISES).map(([group, exs]) => {
            const gc = GC[group] || C.blueL;
            return (
              <TouchableOpacity
                key={group}
                style={[styles.muscleCard, { borderColor: gc + '44' }]}
                onPress={() => router.push(`/exercicios?group=${group}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.muscleDot, { backgroundColor: gc }]} />
                <Text style={styles.muscleGroup}>{group}</Text>
                <Text style={styles.muscleCount}>{exs.length} exs</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
  title: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  exercBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  exercBtnText: { fontSize: 12, fontWeight: '700', color: C.blueXL },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 1,
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    padding: 14,
  },
  planColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
  },
  planDay: { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 2 },
  planLabel: { fontSize: 17, fontWeight: '800', color: C.text },
  planMeta: { fontSize: 11, color: C.sub, textAlign: 'right' },
  planLast: { fontSize: 10, color: C.muted, textAlign: 'right', marginTop: 2 },
  planExTags: { flexDirection: 'row', gap: 6, marginBottom: 10, paddingLeft: 8, flexWrap: 'wrap' },
  exTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  exTagText: { fontSize: 10, fontWeight: '700' },
  startBtn: { fontSize: 13, fontWeight: '700', color: C.blueXL, paddingLeft: 8 },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  routineDot: { width: 10, height: 10, borderRadius: 5 },
  routineName: { fontSize: 15, fontWeight: '700', color: C.text },
  routineLabel: { fontSize: 11, color: C.sub, marginTop: 2 },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleCard: {
    width: '47%',
    backgroundColor: C.card,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  muscleDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  muscleGroup: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  muscleCount: { fontSize: 11, color: C.sub },
});

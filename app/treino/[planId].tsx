import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { C, GC } from '../../src/constants/theme';
import { PLANS, EX_GROUP, RPE_LABELS } from '../../src/constants/data';
import { buildSetsFromHistory, saveSession, fmtDur, fmt } from '../../src/lib/store';
import { loadRoutines } from '../../src/lib/store';

// ─── HELPERS ─────────────────────────────────────────────────
function orm(w: number, r: number) {
  return r > 1 ? Math.round(w * (1 + r / 30) * 10) / 10 : w;
}

// ─── COMPONENT ───────────────────────────────────────────────
export default function ActiveWorkoutScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();

  // Find plan
  const plan = PLANS.find((p) => p.id === planId) ||
    loadRoutines().find((r: any) => r.id === planId);

  const [exercises, setExercises] = useState<any[]>([]);
  const [activeEx, setActiveEx] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState(90);
  const [elapsed, setElapsed] = useState(0);
  const [showRpe, setShowRpe] = useState<{ exIdx: number; setIdx: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!plan) return;
    const built = buildSetsFromHistory(plan);
    setExercises(built);
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [planId]);

  function startRest(seconds: number) {
    if (restRef.current) clearInterval(restRef.current);
    setRestTarget(seconds);
    setRestTimer(seconds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    restRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t === null || t <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return null;
        }
        return t - 1;
      });
    }, 1000);
  }

  function stopRest() {
    if (restRef.current) clearInterval(restRef.current);
    setRestTimer(null);
  }

  function updateSet(exIdx: number, setIdx: number, field: 'w' | 'r', value: string) {
    const v = parseFloat(value) || 0;
    setExercises((exs) =>
      exs.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              activeSets: ex.activeSets.map((s: any, si: number) =>
                si !== setIdx ? s : { ...s, [field]: v }
              ),
            }
      )
    );
  }

  function toggleSetDone(exIdx: number, setIdx: number) {
    const ex = exercises[exIdx];
    const set = ex.activeSets[setIdx];
    if (!set) return;

    const nowDone = !set.done;
    setExercises((exs) =>
      exs.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              activeSets: e.activeSets.map((s: any, si: number) =>
                si !== setIdx ? s : { ...s, done: nowDone }
              ),
            }
      )
    );

    if (nowDone && set.type !== 'warmup') {
      const restSecs = ex.rest || 90;
      startRest(restSecs);
    }
  }

  function setRpe(exIdx: number, setIdx: number, rpe: number) {
    setExercises((exs) =>
      exs.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              activeSets: ex.activeSets.map((s: any, si: number) =>
                si !== setIdx ? s : { ...s, rpe }
              ),
            }
      )
    );
    setShowRpe(null);
  }

  async function finishWorkout() {
    const sessionExercises = exercises
      .filter((ex) => ex.activeSets.some((s: any) => s.done && s.type !== 'warmup'))
      .map((ex) => {
        const workSets = ex.activeSets.filter((s: any) => s.type !== 'warmup' && s.done);
        const vol = workSets.reduce((a: number, s: any) => a + (s.w || 0) * (s.r || 0), 0);
        const bestW = workSets.reduce((a: number, s: any) => Math.max(a, s.w || 0), 0);
        const bestR = workSets.reduce((a: number, s: any) => Math.max(a, s.r || 0), 0);
        const rpSets = workSets.filter((s: any) => s.rpe);
        const avgRpe = rpSets.length > 0 ? rpSets.reduce((a: number, s: any) => a + s.rpe, 0) / rpSets.length : null;
        return {
          name: ex.name,
          sets: workSets.length,
          bestW,
          bestR,
          vol,
          setData: workSets.map((s: any) => ({ w: s.w, r: s.r, rpe: s.rpe || null })),
        };
      });

    if (sessionExercises.length === 0) {
      Alert.alert('Nenhuma série completa', 'Marque pelo menos uma série como concluída.');
      return;
    }

    const totalVol = sessionExercises.reduce((a, e) => a + e.vol, 0);
    const totalSets = sessionExercises.reduce((a, e) => a + e.sets, 0);
    const allRpe = sessionExercises.flatMap((e) => e.setData.filter((s) => s.rpe).map((s) => s.rpe!));
    const avgRpe = allRpe.length > 0 ? allRpe.reduce((a, r) => a + r, 0) / allRpe.length : null;

    const date = new Date().toISOString().slice(0, 10);
    const session = {
      id: 'w' + date.replace(/-/g, ''),
      date,
      name: plan?.name + ' — ' + (plan?.label || ''),
      duration: Math.round(elapsed / 60),
      exercises: sessionExercises,
      totalVol: Math.round(totalVol / 1000 * 100) / 100,
      totalSets,
      avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
      prs: 0,
    };

    try {
      await saveSession(session);
      setFinished(true);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.sub }}>Plano não encontrado</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: C.blueXL, marginTop: 12 }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 20 }}>🏆</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: C.text, marginBottom: 8 }}>Treino Concluído!</Text>
          <Text style={{ fontSize: 16, color: C.sub, textAlign: 'center', marginBottom: 32 }}>
            {fmtDur(Math.round(elapsed / 60))} de treino. Excelente trabalho!
          </Text>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.finishBtnText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const curEx = exercises[activeEx];
  const totalDone = exercises.reduce(
    (a, ex) => a + ex.activeSets.filter((s: any) => s.done && s.type !== 'warmup').length,
    0
  );
  const totalWork = exercises.reduce(
    (a, ex) => a + ex.activeSets.filter((s: any) => s.type !== 'warmup').length,
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert('Sair do treino?', 'O progresso não será salvo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => router.back() },
          ]);
        }}>
          <Text style={styles.backBtn}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.planName}>{plan.name} · {plan.label}</Text>
          <Text style={styles.elapsed}>{fmt(elapsed)} · {totalDone}/{totalWork} séries</Text>
        </View>
        <TouchableOpacity
          style={styles.finishHeaderBtn}
          onPress={() => Alert.alert('Finalizar treino?', '', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Finalizar', onPress: finishWorkout },
          ])}
        >
          <Text style={styles.finishHeaderBtnText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${totalWork > 0 ? (totalDone / totalWork) * 100 : 0}%` }]} />
      </View>

      {/* Rest timer */}
      {restTimer !== null && (
        <TouchableOpacity style={styles.restBanner} onPress={stopRest} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.restRing}>
              <Text style={styles.restTime}>{fmt(restTimer)}</Text>
            </View>
            <View>
              <Text style={styles.restTitle}>Descansando</Text>
              <Text style={styles.restSub}>Toque para pular</Text>
            </View>
          </View>
          <View style={styles.restProgressBg}>
            <View style={[styles.restProgressFill, { width: `${((restTarget - restTimer) / restTarget) * 100}%` }]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Exercise tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exTabs}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {exercises.map((ex, i) => {
          const isActive = i === activeEx;
          const gc = GC[EX_GROUP[ex.name]] || C.blueL;
          const doneSets = ex.activeSets.filter((s: any) => s.done && s.type !== 'warmup').length;
          const totalExSets = ex.activeSets.filter((s: any) => s.type !== 'warmup').length;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveEx(i)}
              style={[styles.exTab, isActive && { backgroundColor: gc + '22', borderColor: gc + '66' }]}
            >
              <Text style={[styles.exTabText, isActive && { color: gc }]} numberOfLines={1}>
                {ex.name.split(' ')[0]}
              </Text>
              <Text style={[styles.exTabCount, isActive && { color: gc }]}>
                {doneSets}/{totalExSets}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Current exercise */}
      {curEx && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.exContent}>
          <View style={styles.exHeader}>
            <View style={[styles.exDot, { backgroundColor: GC[EX_GROUP[curEx.name]] || C.blueL }]} />
            <Text style={styles.exName}>{curEx.name}</Text>
          </View>
          {curEx._deload && (
            <View style={styles.deloadBadge}>
              <Text style={styles.deloadText}>⚡ Deload ativo</Text>
            </View>
          )}

          {/* Sets */}
          {curEx.activeSets.map((set: any, si: number) => {
            const isWarmup = set.type === 'warmup';
            const gc = GC[EX_GROUP[curEx.name]] || C.blueL;
            const setNum = curEx.activeSets.slice(0, si).filter((s: any) => s.type !== 'warmup').length + 1;

            return (
              <View key={si} style={[styles.setRow, set.done && styles.setRowDone, isWarmup && styles.setRowWarmup]}>
                {/* Set number */}
                <View style={[styles.setNumBadge, set.done && { backgroundColor: gc + '33' }]}>
                  <Text style={[styles.setNum, set.done && { color: gc }]}>
                    {isWarmup ? 'A' : setNum}
                  </Text>
                </View>

                {/* Weight */}
                <View style={styles.setField}>
                  <Text style={styles.setFieldLabel}>KG</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.w === 0 ? '' : String(set.w)}
                    onChangeText={(v) => updateSet(activeEx, si, 'w', v)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    editable={!set.done}
                  />
                </View>

                <Text style={styles.setSep}>×</Text>

                {/* Reps */}
                <View style={styles.setField}>
                  <Text style={styles.setFieldLabel}>REPS</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.r === 0 ? '' : String(set.r)}
                    onChangeText={(v) => updateSet(activeEx, si, 'r', v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    editable={!set.done}
                  />
                </View>

                {/* RPE */}
                {set.rpe && (
                  <TouchableOpacity onPress={() => setShowRpe({ exIdx: activeEx, setIdx: si })}>
                    <Text style={[styles.rpeTag, { color: gc }]}>@{set.rpe}</Text>
                  </TouchableOpacity>
                )}
                {!set.rpe && set.done && (
                  <TouchableOpacity onPress={() => setShowRpe({ exIdx: activeEx, setIdx: si })}>
                    <Text style={styles.addRpe}>+RPE</Text>
                  </TouchableOpacity>
                )}

                {/* Done toggle */}
                <TouchableOpacity
                  onPress={() => toggleSetDone(activeEx, si)}
                  style={[styles.doneBtn, set.done && { backgroundColor: gc }]}
                >
                  <Text style={[styles.doneBtnText, set.done && { color: '#fff' }]}>
                    {set.done ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Manual rest button */}
          <View style={styles.restActions}>
            {[60, 90, 120, 180].map((secs) => (
              <TouchableOpacity
                key={secs}
                style={styles.restBtn}
                onPress={() => startRest(secs)}
              >
                <Text style={styles.restBtnText}>{fmt(secs)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nav buttons */}
          <View style={styles.navBtns}>
            {activeEx > 0 && (
              <TouchableOpacity style={styles.navBtn} onPress={() => setActiveEx(activeEx - 1)}>
                <Text style={styles.navBtnText}>← Anterior</Text>
              </TouchableOpacity>
            )}
            {activeEx < exercises.length - 1 && (
              <TouchableOpacity
                style={[styles.navBtn, styles.navBtnNext]}
                onPress={() => setActiveEx(activeEx + 1)}
              >
                <Text style={[styles.navBtnText, { color: C.blueXL }]}>Próximo →</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* RPE Modal */}
      {showRpe && (
        <View style={styles.rpeOverlay}>
          <View style={styles.rpeModal}>
            <Text style={styles.rpeModalTitle}>Selecionar RPE</Text>
            <View style={styles.rpeGrid}>
              {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.rpeOption}
                  onPress={() => setRpe(showRpe.exIdx, showRpe.setIdx, v)}
                >
                  <Text style={styles.rpeOptionVal}>{v}</Text>
                  <Text style={styles.rpeOptionLabel}>{RPE_LABELS[v]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowRpe(null)} style={styles.rpeCancelBtn}>
              <Text style={styles.rpeCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { fontSize: 20, color: C.sub, fontWeight: '600', padding: 4 },
  planName: { fontSize: 15, fontWeight: '800', color: C.text },
  elapsed: { fontSize: 11, color: C.sub, marginTop: 2 },
  finishHeaderBtn: {
    backgroundColor: C.mint + '22',
    borderWidth: 1,
    borderColor: C.mint + '44',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  finishHeaderBtnText: { fontSize: 13, fontWeight: '700', color: C.mint },
  progressBg: { height: 2, backgroundColor: C.border },
  progressFill: { height: '100%', backgroundColor: C.blueL },
  restBanner: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37,99,235,0.3)',
    padding: 12,
  },
  restRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37,99,235,0.2)',
    borderWidth: 2,
    borderColor: C.blueL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTime: { fontSize: 15, fontWeight: '800', color: C.blueXL },
  restTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  restSub: { fontSize: 11, color: C.sub },
  restProgressBg: { height: 2, backgroundColor: 'rgba(37,99,235,0.2)', marginTop: 8, borderRadius: 1 },
  restProgressFill: { height: '100%', backgroundColor: C.blueL, borderRadius: 1 },
  exTabs: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: C.border },
  exTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
  },
  exTabText: { fontSize: 11, fontWeight: '700', color: C.sub },
  exTabCount: { fontSize: 10, color: C.muted, marginTop: 1 },
  exContent: { padding: 16, paddingBottom: 40 },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  exDot: { width: 10, height: 10, borderRadius: 5 },
  exName: { fontSize: 18, fontWeight: '800', color: C.text, flex: 1 },
  deloadBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  deloadText: { fontSize: 12, fontWeight: '600', color: C.amber },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  setRowDone: { backgroundColor: 'rgba(37,99,235,0.06)', borderColor: 'rgba(37,99,235,0.15)' },
  setRowWarmup: { opacity: 0.6 },
  setNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNum: { fontSize: 12, fontWeight: '800', color: C.sub },
  setField: { alignItems: 'center' },
  setFieldLabel: { fontSize: 8, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 2 },
  setInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    width: 64,
    height: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  setSep: { fontSize: 16, color: C.muted, fontWeight: '600' },
  rpeTag: { fontSize: 12, fontWeight: '700' },
  addRpe: { fontSize: 11, color: C.muted },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: C.sub },
  restActions: { flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' },
  restBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
  },
  restBtnText: { fontSize: 12, fontWeight: '700', color: C.blueXL },
  navBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  navBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  navBtnNext: { borderColor: C.blueL + '44', backgroundColor: 'rgba(37,99,235,0.08)' },
  navBtnText: { fontSize: 14, fontWeight: '700', color: C.sub },
  finishBtn: {
    backgroundColor: C.blueL,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    alignItems: 'center',
  },
  finishBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  rpeOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  } as any,
  rpeModal: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
  },
  rpeModalTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 16 },
  rpeGrid: { gap: 6 },
  rpeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rpeOptionVal: { fontSize: 16, fontWeight: '800', color: C.text, width: 36 },
  rpeOptionLabel: { fontSize: 14, color: C.sub },
  rpeCancelBtn: { marginTop: 16, padding: 14, alignItems: 'center' },
  rpeCancelText: { fontSize: 15, color: C.sub, fontWeight: '600' },
});

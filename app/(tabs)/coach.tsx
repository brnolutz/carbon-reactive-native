import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { C } from '../../src/constants/theme';
import {
  FEED,
  WEEKLY,
  WEEKS,
  loadDeload,
  saveDeload,
  refreshDerivedData,
  getWeekStats,
  fmtDate,
} from '../../src/lib/store';
import { useAuth } from '../../src/hooks/useAuth';

function fmt(n: number) {
  return new Date(Date.now() + n * 86400000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export default function CoachScreen() {
  const { signOut } = useAuth();
  const [, forceUpdate] = useState(0);
  const deload = loadDeload();
  const weekStats = getWeekStats();

  useFocusEffect(
    useCallback(() => {
      refreshDerivedData();
      forceUpdate((n) => n + 1);
    }, [])
  );

  // Volume trend
  const last4Weeks = WEEKS.slice(-4);
  const vols = last4Weeks.map((w) => WEEKLY[w]?.vol || 0);
  const avgVol = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
  const curVol = vols[vols.length - 1] || 0;
  const prevVol = vols[vols.length - 2] || 0;

  // Fatigue signals
  const signals = [];
  if (curVol < prevVol * 0.8) signals.push('Volume caindo — possível fadiga acumulada');
  if (FEED.length > 0) {
    const avgRpe = FEED.slice(0, 5).filter((s) => s.avgRpe).reduce((a, s) => a + (s.avgRpe || 0), 0) / 5;
    if (avgRpe > 9) signals.push('RPE médio muito alto nas últimas sessões');
  }
  const daysSinceLast = FEED.length > 0
    ? Math.round((Date.now() - new Date(FEED[0].date + 'T12:00:00').getTime()) / 86400000)
    : null;
  if (daysSinceLast && daysSinceLast > 3) signals.push(`Sem treino há ${daysSinceLast} dias`);

  // Suggestions
  const suggestions = [];
  if (weekStats.sessions >= 5) {
    suggestions.push({ emoji: '🏆', title: 'Ótima semana!', body: `${weekStats.sessions} treinos — consistência excelente.` });
  }
  if (weekStats.vol > avgVol * 1.2) {
    suggestions.push({ emoji: '⚡', title: 'Volume alto', body: 'Considere uma semana de deload em breve.' });
  }
  if (signals.length >= 2) {
    suggestions.push({ emoji: '😴', title: 'Sinais de fadiga', body: 'Seu corpo pode precisar de recuperação. Pense em um deload.' });
  }
  if (suggestions.length === 0) {
    suggestions.push({ emoji: '💪', title: 'Continue assim!', body: 'Seu progresso está consistente. Mantenha o ritmo.' });
  }

  async function startDeload(method: string, intensity: number) {
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const config = { active: true, method, intensity, startDate, endDate, sessionsInDeload: [] };
    await saveDeload(config);
    forceUpdate((n) => n + 1);
  }

  async function endDeload() {
    if (!deload) return;
    const config = { ...deload, active: false, endedAt: new Date().toISOString().slice(0, 10) };
    await saveDeload(config);
    forceUpdate((n) => n + 1);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Coach</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Sair', 'Deseja sair da conta?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', onPress: signOut, style: 'destructive' },
            ])}
            style={styles.signOutBtn}
          >
            <Text style={styles.signOutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Deload banner */}
        {deload?.active && (
          <View style={styles.deloadBanner}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.deloadBannerTitle}>⚡ Semana de Deload Ativa</Text>
                <Text style={styles.deloadBannerSub}>Método: {deload.method} · {deload.intensity}% intensidade</Text>
                <Text style={styles.deloadBannerSub}>Até {deload.endDate}</Text>
              </View>
              <TouchableOpacity onPress={endDeload} style={styles.endDeloadBtn}>
                <Text style={styles.endDeloadBtnText}>Encerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fatigue signals */}
        {signals.length > 0 && (
          <View style={styles.signalsCard}>
            <Text style={styles.sectionLabel}>⚠️ SINAIS DE ATENÇÃO</Text>
            {signals.map((s, i) => (
              <View key={i} style={styles.signalRow}>
                <View style={styles.signalDot} />
                <Text style={styles.signalText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions */}
        <Text style={styles.sectionLabel}>SUGESTÕES</Text>
        {suggestions.map((s, i) => (
          <View key={i} style={styles.suggCard}>
            <Text style={styles.suggEmoji}>{s.emoji}</Text>
            <View>
              <Text style={styles.suggTitle}>{s.title}</Text>
              <Text style={styles.suggBody}>{s.body}</Text>
            </View>
          </View>
        ))}

        {/* Deload options */}
        {!deload?.active && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SEMANA DE DELOAD</Text>
            <Text style={styles.deloadDesc}>
              Um deload reduz o estresse de treino por 1 semana para recuperação completa.
            </Text>
            {[
              { method: 'volume', label: 'Reduzir Volume', desc: 'Menos séries (−40%), mesmo peso', intensity: 60 },
              { method: 'intensity', label: 'Reduzir Intensidade', desc: 'Mesmo volume, peso mais leve (60%)', intensity: 60 },
              { method: 'technique', label: 'Foco em Técnica', desc: 'Movimentos lentos e controlados', intensity: 70 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.method}
                style={styles.deloadOption}
                onPress={() => Alert.alert(
                  `Iniciar: ${opt.label}`,
                  opt.desc + '\n\nIsso modificará seus treinos por 7 dias.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Iniciar Deload', onPress: () => startDeload(opt.method, opt.intensity) },
                  ]
                )}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.deloadOptLabel}>{opt.label}</Text>
                  <Text style={styles.deloadOptDesc}>{opt.desc}</Text>
                </View>
                <Text style={styles.deloadOptArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Stats overview */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>RESUMO GERAL</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Total de Treinos', value: FEED.length },
            { label: 'Volume Médio/Semana', value: avgVol.toFixed(1) + 't' },
            { label: 'Último Treino', value: FEED.length > 0 ? fmtDate(FEED[0].date) : '—' },
            { label: 'Esta Semana', value: weekStats.sessions + ' treinos' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  signOutBtn: { padding: 8 },
  signOutText: { fontSize: 14, color: C.sub },
  deloadBanner: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  deloadBannerTitle: { fontSize: 14, fontWeight: '800', color: C.amber, marginBottom: 4 },
  deloadBannerSub: { fontSize: 11, color: C.sub, marginBottom: 2 },
  endDeloadBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  endDeloadBtnText: { fontSize: 12, fontWeight: '700', color: C.coral },
  signalsCard: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 1,
    marginBottom: 10,
  },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  signalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.coral },
  signalText: { fontSize: 13, color: '#CBD5E1', flex: 1 },
  suggCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  suggEmoji: { fontSize: 24 },
  suggTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 3 },
  suggBody: { fontSize: 13, color: C.sub },
  deloadDesc: { fontSize: 13, color: C.sub, marginBottom: 12, lineHeight: 18 },
  deloadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  deloadOptLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  deloadOptDesc: { fontSize: 12, color: C.sub },
  deloadOptArrow: { fontSize: 18, color: C.blueXL },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '47%',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
  },
  statLabel: { fontSize: 10, color: C.sub, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: C.text },
});

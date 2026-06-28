import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { C, GC, MUSCLE_COLORS } from '../../src/constants/theme';
import {
  FEED,
  WEEKLY,
  WEEKS,
  W_DATA,
  HIST,
  getGreeting,
  fmtDate,
  refreshDerivedData,
  getAllSessions,
} from '../../src/lib/store';
import { EX_GROUP, ALL_EXERCISES } from '../../src/constants/data';

const { width } = Dimensions.get('window');
const CHART_W = width - 32;
const CHART_H = 120;

function MiniLineChart({
  values,
  color,
  height = 80,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  if (!values || values.length < 2) return null;
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const rng = mx - mn || 1;
  const w = CHART_W;
  const h = height;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - mn) / rng) * (h - 16) - 8,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={`g${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaD} fill={`url(#g${color.replace('#', '')})`} />
      <Path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r="4" fill={color} stroke="#07090F" strokeWidth="2" />
    </Svg>
  );
}

function BarChart({
  values,
  labels,
  color,
  height = 80,
}: {
  values: number[];
  labels?: string[];
  color: string;
  height?: number;
}) {
  if (!values || values.length === 0) return null;
  const mx = Math.max(...values) || 1;
  const w = CHART_W;
  const barW = (w / values.length) * 0.6;
  const gap = w / values.length;

  return (
    <Svg width={w} height={height + 20}>
      {values.map((v, i) => {
        const barH = (v / mx) * height;
        const x = i * gap + gap * 0.2;
        const y = height - barH;
        return (
          <React.Fragment key={i}>
            <Path
              d={`M${x},${height} L${x},${y} Q${x},${y - 3} ${x + barW / 2},${y - 3} Q${x + barW},${y - 3} ${x + barW},${y} L${x + barW},${height} Z`}
              fill={color}
              opacity={i === values.length - 1 ? 1 : 0.5}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function MuscleMap({ sessions }: { sessions: any[] }) {
  const muscleVol: Record<string, number> = {};
  sessions.forEach((s) => {
    s.exercises?.forEach((ex: any) => {
      const g = EX_GROUP[ex.name];
      const lbl: Record<string, string> = {
        Peito: 'Peito',
        Costas: 'Costas',
        Ombros: 'Ombros',
        Pernas: 'Pernas',
        Biceps: 'Braços',
        Triceps: 'Braços',
        Core: 'Core',
      };
      const label = lbl[g] || g;
      if (label) muscleVol[label] = (muscleVol[label] || 0) + (ex.vol || 0);
    });
  });

  const total = Object.values(muscleVol).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(muscleVol).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.muscleMap}>
      {sorted.map(([muscle, vol]) => {
        const pct = Math.round((vol / total) * 100);
        const color = MUSCLE_COLORS[muscle] || C.blueL;
        return (
          <View key={muscle} style={styles.muscleRow}>
            <Text style={styles.muscleName}>{muscle}</Text>
            <View style={styles.muscleBarBg}>
              <View style={[styles.muscleBarFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.musclePct, { color }]}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
}

type Range = '1m' | '3m' | '6m' | 'all';

export default function ProgressoScreen() {
  const [range, setRange] = useState<Range>('3m');
  const [, forceUpdate] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshDerivedData();
      forceUpdate((n) => n + 1);
    }, [])
  );

  const rangeDays: Record<Range, number> = { '1m': 30, '3m': 90, '6m': 180, all: 9999 };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays[range]);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const sessions = getAllSessions().filter((s) => s.date >= cutoffStr);

  // Volume by week
  const weekKeys = WEEKS.filter((w) => w >= cutoffStr);
  const weekVols = weekKeys.map((w) => WEEKLY[w]?.vol || 0);
  const weekLabels = weekKeys.map((w) =>
    new Date(w + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  );

  // Weight data
  const weightData = W_DATA.slice(-rangeDays[range]);

  // Session count
  const totalSessions = sessions.length;
  const totalVol = sessions.reduce((a, s) => a + (s.totalVol || 0), 0);
  const totalSets = sessions.reduce((a, s) => a + (s.totalSets || 0), 0);
  const prs = sessions.reduce((a, s) => a + (s.prs || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Progresso</Text>

        {/* Range selector */}
        <View style={styles.rangeRow}>
          {(['1m', '3m', '6m', 'all'] as Range[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                {r === 'all' ? 'Tudo' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Treinos', value: totalSessions, color: C.blueXL },
            { label: 'Volume Total', value: totalVol.toFixed(1) + 't', color: C.mint },
            { label: 'Séries', value: totalSets, color: C.amber },
            { label: 'Recordes', value: prs, color: '#F472B6' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Volume Chart */}
        {weekVols.length > 1 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Volume Semanal (ton)</Text>
            <Text style={styles.chartValue}>
              {weekVols[weekVols.length - 1]?.toFixed(1)}t esta semana
            </Text>
            <BarChart values={weekVols} color={C.blueL} height={CHART_H} />
          </View>
        )}

        {/* Weight Chart */}
        {weightData.length > 1 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Evolução do Peso</Text>
            <Text style={styles.chartValue}>
              {weightData[weightData.length - 1]}kg atual
            </Text>
            <MiniLineChart values={weightData} color={C.mint} height={CHART_H} />
          </View>
        )}

        {/* Muscle distribution */}
        {sessions.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Distribuição Muscular</Text>
            <MuscleMap sessions={sessions} />
          </View>
        )}

        {/* Session list */}
        <Text style={styles.sectionTitle}>SESSÕES</Text>
        {sessions.slice(0, 20).map((s) => (
          <View key={s.id} style={styles.sessionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionName}>{s.name}</Text>
              <Text style={styles.sessionDate}>{fmtDate(s.date)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.sessionVol}>{s.totalVol}t</Text>
              <Text style={styles.sessionSets}>{s.totalSets} séries</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginBottom: 16 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  rangeBtnActive: { backgroundColor: C.blueL + '22', borderColor: C.blueL + '66' },
  rangeBtnText: { fontSize: 12, fontWeight: '700', color: C.sub },
  rangeBtnTextActive: { color: C.blueXL },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: {
    width: '47%',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '900' },
  chartCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chartTitle: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 4 },
  chartValue: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 12 },
  muscleMap: { gap: 8 },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muscleName: { fontSize: 12, fontWeight: '600', color: C.text, width: 70 },
  muscleBarBg: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3 },
  muscleBarFill: { height: '100%', borderRadius: 3 },
  musclePct: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  sessionName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  sessionDate: { fontSize: 11, color: C.sub },
  sessionVol: { fontSize: 14, fontWeight: '800', color: C.blueXL },
  sessionSets: { fontSize: 11, color: C.sub },
});

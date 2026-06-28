import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { C } from '../../src/constants/theme';
import {
  W_DATA,
  loadBodyMeasures,
  loadMeasureHistory,
  loadWeightGoal,
  saveWeight,
  saveWeightGoal,
  saveMeasureHistory,
  refreshDerivedData,
} from '../../src/lib/store';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CHART_W = width - 32;

function WeightChart({ values }: { values: number[] }) {
  if (!values || values.length < 2) return null;
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const rng = mx - mn || 1;
  const w = CHART_W;
  const h = 100;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - mn) / rng) * (h - 20) - 10,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={C.mint} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={C.mint} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaD} fill="url(#wg)" />
      <Path d={pathD} fill="none" stroke={C.mint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r="4" fill={C.mint} stroke="#07090F" strokeWidth="2" />
    </Svg>
  );
}

const MEASUREMENTS = [
  { key: 'Cintura', label: 'Cintura', unit: 'cm', icon: '📏' },
  { key: 'Quadril', label: 'Quadril', unit: 'cm', icon: '📐' },
  { key: 'Peito', label: 'Peito', unit: 'cm', icon: '💪' },
  { key: 'Braço', label: 'Braço', unit: 'cm', icon: '💪' },
  { key: 'Coxa', label: 'Coxa', unit: 'cm', icon: '🦵' },
];

export default function CorpoScreen() {
  const [, forceUpdate] = useState(0);
  const [weightInput, setWeightInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshDerivedData();
      const current = loadBodyMeasures();
      const obj: Record<string, string> = {};
      MEASUREMENTS.forEach((m) => {
        obj[m.key] = current[m.key] ? String(current[m.key]) : '';
      });
      setMeasurements(obj);
      setGoalInput(String(loadWeightGoal()));
      forceUpdate((n) => n + 1);
    }, [])
  );

  const currentWeight = W_DATA.length > 0 ? W_DATA[W_DATA.length - 1] : null;
  const weightGoal = loadWeightGoal();
  const weightDiff = currentWeight ? Math.round((currentWeight - weightGoal) * 10) / 10 : null;

  async function handleSaveWeight() {
    const v = parseFloat(weightInput);
    if (isNaN(v) || v < 20 || v > 300) {
      Alert.alert('Peso inválido', 'Digite um peso entre 20 e 300 kg.');
      return;
    }
    setSaving(true);
    await saveWeight(v);
    setSaving(false);
    setWeightInput('');
    refreshDerivedData();
    forceUpdate((n) => n + 1);
  }

  async function handleSaveGoal() {
    const v = parseFloat(goalInput);
    if (isNaN(v) || v < 20 || v > 300) return;
    await saveWeightGoal(v);
  }

  async function handleSaveMeasurements() {
    const history = loadMeasureHistory();
    const today = new Date().toISOString().slice(0, 10);
    const fields: Record<string, number> = {};
    MEASUREMENTS.forEach((m) => {
      const v = parseFloat(measurements[m.key]);
      if (!isNaN(v) && v > 0) fields[m.key] = v;
    });

    const existing = history.find((r) => r.date === today);
    let newHistory;
    if (existing) {
      newHistory = history.map((r) => (r.date === today ? { ...r, ...fields } : r));
    } else {
      newHistory = [...history, { date: today, ...fields }].sort((a, b) => a.date.localeCompare(b.date));
    }
    await saveMeasureHistory(newHistory);
    Alert.alert('Medidas salvas!', 'Suas medidas foram atualizadas.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Corpo</Text>

        {/* Weight card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PESO</Text>
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.weightValue}>
                {currentWeight ? currentWeight + 'kg' : '—'}
              </Text>
              {weightDiff !== null && (
                <Text style={[styles.weightDiff, { color: Math.abs(weightDiff) < 0.5 ? C.mint : weightDiff > 0 ? C.amber : C.mint }]}>
                  {weightDiff > 0 ? '+' : ''}{weightDiff}kg vs meta
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.goalLabel}>Meta: {weightGoal}kg</Text>
              <View style={styles.goalInputRow}>
                <TextInput
                  style={styles.goalInput}
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="decimal-pad"
                  placeholder={String(weightGoal)}
                  placeholderTextColor={C.muted}
                  onBlur={handleSaveGoal}
                />
                <Text style={styles.goalUnit}>kg</Text>
              </View>
            </View>
          </View>

          {/* Weight input */}
          <View style={styles.weightInputRow}>
            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="Peso de hoje"
              placeholderTextColor={C.muted}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveWeight} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? '...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>

          {/* Chart */}
          {W_DATA.length > 1 && (
            <View style={{ marginTop: 12 }}>
              <WeightChart values={W_DATA.slice(-30)} />
            </View>
          )}
        </View>

        {/* Measurements */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MEDIDAS CORPORAIS</Text>
          {MEASUREMENTS.map((m) => (
            <View key={m.key} style={styles.measureRow}>
              <Text style={styles.measureLabel}>{m.icon} {m.label}</Text>
              <View style={styles.measureInputWrap}>
                <TextInput
                  style={styles.measureInput}
                  value={measurements[m.key]}
                  onChangeText={(v) => setMeasurements((prev) => ({ ...prev, [m.key]: v }))}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={C.muted}
                />
                <Text style={styles.measureUnit}>{m.unit}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.saveMeasuresBtn} onPress={handleSaveMeasurements}>
            <Text style={styles.saveMeasuresBtnText}>Salvar Medidas</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        {loadMeasureHistory().length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>HISTÓRICO DE PESO</Text>
            {[...loadMeasureHistory()]
              .reverse()
              .filter((h) => h.Peso)
              .slice(0, 10)
              .map((h) => (
                <View key={h.date} style={styles.histRow}>
                  <Text style={styles.histDate}>{h.date}</Text>
                  <Text style={styles.histWeight}>{h.Peso}kg</Text>
                </View>
              ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.5, marginBottom: 16 },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 1,
    marginBottom: 12,
  },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  weightValue: { fontSize: 36, fontWeight: '900', color: C.text },
  weightDiff: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  goalLabel: { fontSize: 10, color: C.sub, marginBottom: 4 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 8,
    width: 70,
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  goalUnit: { fontSize: 13, color: C.sub },
  weightInputRow: { flexDirection: 'row', gap: 8 },
  weightInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: C.text,
  },
  saveBtn: {
    backgroundColor: C.mint + '22',
    borderWidth: 1,
    borderColor: C.mint + '44',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: C.mint },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border + '33',
  },
  measureLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  measureInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  measureInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 8,
    width: 80,
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  measureUnit: { fontSize: 12, color: C.sub },
  saveMeasuresBtn: {
    backgroundColor: C.blueL,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  saveMeasuresBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border + '33',
  },
  histDate: { fontSize: 13, color: C.sub },
  histWeight: { fontSize: 14, fontWeight: '700', color: C.text },
});

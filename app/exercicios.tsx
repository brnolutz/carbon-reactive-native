import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { C, GC } from '../../src/constants/theme';
import { ALL_EXERCISES, EX_GROUP, EXERCISES_INFO, EXERCISE_IDS, RAPIDAPI_KEY } from '../../src/constants/data';
import { HIST, getBestORM, getBestW, getHistory, orm, fmtDate } from '../../src/lib/store';

function ExerciseGif({ exName, color }: { exName: string; color: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const id = EXERCISE_IDS[exName];

  if (!id) return null;

  const gifUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${id}&resolution=180&rapidapi-key=${RAPIDAPI_KEY}`;

  return (
    <View style={styles.gifContainer}>
      {!loaded && !error && (
        <View style={styles.gifLoader}>
          <ActivityIndicator color={color} />
        </View>
      )}
      {!error && (
        <Image
          source={{ uri: gifUrl, headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'exercisedb.p.rapidapi.com' } }}
          style={[styles.gif, loaded ? {} : { opacity: 0 }]}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setError(true); }}
          resizeMode="contain"
        />
      )}
      {error && (
        <View style={styles.gifError}>
          <Text style={{ fontSize: 32 }}>🏋️</Text>
          <Text style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>Animação indisponível</Text>
        </View>
      )}
    </View>
  );
}

function ExerciseDetail({ name, onBack }: { name: string; onBack: () => void }) {
  const info = EXERCISES_INFO[name] || { group: '', secondary: [], type: '', equipment: '', muscles: [], instructions: [], tips: '' };
  const gc = GC[EX_GROUP[name]] || C.blueL;
  const hist = HIST[name] || [];
  const bestW = getBestW(name);
  const bestORM = getBestORM(name);
  const recentHistory = getHistory(name);
  const [tab, setTab] = useState<'resumo' | 'historico'>('resumo');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={[styles.detailHeader, { borderBottomColor: gc + '33' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle} numberOfLines={2}>{name}</Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* GIF */}
        <ExerciseGif exName={name} color={gc} />

        {/* Info bar */}
        <View style={[styles.infoBar, { backgroundColor: C.bg }]}>
          <View style={styles.infoBadge}>
            <Text style={[styles.infoBadgeText, { color: gc }]}>{info.group || EX_GROUP[name]}</Text>
          </View>
          {info.type && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>{info.type}</Text>
            </View>
          )}
          {info.equipment && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>{info.equipment}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        {(bestW > 0 || bestORM > 0) && (
          <View style={[styles.statsRow, { backgroundColor: C.bg }]}>
            {bestW > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Melhor carga</Text>
                <Text style={[styles.statItemVal, { color: gc }]}>{bestW}kg</Text>
              </View>
            )}
            {bestORM > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>1RM Estimado</Text>
                <Text style={[styles.statItemVal, { color: gc }]}>{bestORM}kg</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Sessões</Text>
              <Text style={[styles.statItemVal, { color: gc }]}>{hist.length}</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: C.bg }]}>
          {(['resumo', 'historico'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && { borderBottomColor: gc, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.tabBtnText, tab === t && { color: gc }]}>
                {t === 'resumo' ? 'Resumo' : 'Histórico'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: C.bg, padding: 16 }}>
          {tab === 'resumo' ? (
            <>
              {/* Muscles */}
              {info.muscles?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.secTitle}>Músculos</Text>
                  {info.muscles.map((m) => (
                    <View key={m} style={styles.bulletRow}>
                      <View style={[styles.bullet, { backgroundColor: gc }]} />
                      <Text style={styles.bulletText}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Instructions */}
              {info.instructions?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.secTitle}>Execução</Text>
                  {info.instructions.map((ins, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={[styles.stepNum, { backgroundColor: gc + '22' }]}>
                        <Text style={[styles.stepNumText, { color: gc }]}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{ins}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Tips */}
              {info.tips && (
                <View style={[styles.tipsCard, { borderLeftColor: gc }]}>
                  <Text style={styles.tipsLabel}>💡 Dica</Text>
                  <Text style={styles.tipsText}>{info.tips}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {recentHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📊</Text>
                  <Text style={{ fontSize: 14, color: C.sub }}>Sem histórico ainda</Text>
                </View>
              ) : (
                recentHistory.map((h, i) => (
                  <View key={i} style={styles.histCard}>
                    <Text style={styles.histDate}>{fmtDate(h.d)}</Text>
                    {h.sets.map((s: any, si: number) => (
                      <View key={si} style={styles.histSetRow}>
                        <Text style={styles.histSetNum}>Série {si + 1}</Text>
                        <Text style={styles.histSetVal}>
                          {s.w > 0 ? s.w + 'kg' : '—'} × {s.r}
                          {s.rpe ? ` @ ${s.rpe} RPE` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ExerciciosScreen() {
  const { group: groupParam } = useLocalSearchParams<{ group?: string }>();
  const [search, setSearch] = useState('');
  const [selGroup, setSelGroup] = useState(groupParam || 'Todos');
  const [selEx, setSelEx] = useState<string | null>(null);

  const groups = ['Todos', ...Object.keys(ALL_EXERCISES)];
  const allFlat = Object.entries(ALL_EXERCISES).flatMap(([g, exs]) => exs.map((e) => ({ name: e, group: g })));

  const filtered = useMemo(
    () =>
      allFlat.filter((e) => {
        const matchGroup = selGroup === 'Todos' || e.group === selGroup;
        const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
        return matchGroup && matchSearch;
      }),
    [selGroup, search]
  );

  if (selEx) {
    return <ExerciseDetail name={selEx} onBack={() => setSelEx(null)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Exercícios</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar exercício..."
          placeholderTextColor={C.muted}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Group filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupFilter} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {groups.map((g) => {
          const gc = GC[g] || C.blueL;
          const isActive = selGroup === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => setSelGroup(g)}
              style={[styles.groupBtn, isActive && { backgroundColor: gc + '22', borderColor: gc + '66' }]}
            >
              <Text style={[styles.groupBtnText, isActive && { color: gc }]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.countText}>{filtered.length} exercício{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.map((e) => {
          const gc = GC[e.group] || C.blueL;
          const info = EXERCISES_INFO[e.name];
          const hist = HIST[e.name] || [];
          return (
            <TouchableOpacity
              key={e.name}
              style={styles.exCard}
              onPress={() => setSelEx(e.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.exIcon, { backgroundColor: gc + '22', borderColor: gc + '44' }]}>
                <Text style={[styles.exIconText, { color: gc }]}>{e.name.slice(0, 3).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.exName} numberOfLines={1}>{e.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={[styles.exGroup, { color: gc }]}>{e.group}</Text>
                  {info?.type && <Text style={styles.exType}>{info.type}</Text>}
                  {hist.length > 0 && <Text style={styles.exSessions}>{hist.length}× treinado</Text>}
                </View>
              </View>
              <Text style={styles.exArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🏋️</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.sub }}>Nenhum exercício encontrado</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 24, color: C.sub, lineHeight: 28, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '900', color: C.text },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 16 },
  groupFilter: { maxHeight: 44, marginBottom: 4 },
  groupBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  groupBtnText: { fontSize: 11, fontWeight: '700', color: C.sub },
  countText: { fontSize: 11, color: C.muted, marginBottom: 10 },
  exCard: {
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
  exIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIconText: { fontSize: 11, fontWeight: '800' },
  exName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  exGroup: { fontSize: 10, fontWeight: '700' },
  exType: { fontSize: 10, color: C.muted },
  exSessions: { fontSize: 10, color: C.sub },
  exArrow: { fontSize: 18, color: C.muted },
  // Detail styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
  },
  detailTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: C.text },
  gifContainer: {
    backgroundColor: '#fff',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: { width: '100%', height: 250 },
  gifLoader: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 220,
  },
  gifError: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8', width: '100%' },
  infoBar: { flexDirection: 'row', gap: 8, padding: 16, flexWrap: 'wrap' },
  infoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.card,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoBadgeText: { fontSize: 11, fontWeight: '700', color: C.sub },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
  },
  statItemLabel: { fontSize: 9, color: C.sub, fontWeight: '600', marginBottom: 3 },
  statItemVal: { fontSize: 18, fontWeight: '900' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2 },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: C.sub },
  section: { marginBottom: 20 },
  secTitle: { fontSize: 12, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  bulletText: { fontSize: 14, color: C.text },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
  tipsCard: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginTop: 4,
  },
  tipsLabel: { fontSize: 11, fontWeight: '700', color: C.amber, marginBottom: 4 },
  tipsText: { fontSize: 13, color: C.sub, lineHeight: 18 },
  histCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  histDate: { fontSize: 12, fontWeight: '700', color: C.blueXL, marginBottom: 8 },
  histSetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.border + '33' },
  histSetNum: { fontSize: 12, color: C.sub },
  histSetVal: { fontSize: 13, fontWeight: '700', color: C.text },
  emptyState: { alignItems: 'center', padding: 40 },
});

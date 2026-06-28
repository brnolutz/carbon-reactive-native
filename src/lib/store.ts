import { supabase, rowToSession, sessionToRow, measureRowToEntry } from './supabase';
import type { WorkoutSession, MeasurementEntry } from './supabase';

// ─── IN-MEMORY CACHE ─────────────────────────────────────────
let _sessionsCache: WorkoutSession[] = [];
let _measureHistoryCache: MeasurementEntry[] = [];
let _weightGoalCache = 74;
let _deloadCache: any = null;

export let FEED: WorkoutSession[] = [];
export let WEEKLY: Record<string, any> = {};
export let WEEKS: string[] = [];
export let HIST: Record<string, { d: string; sets: any[] }[]> = {};
export let W_DATA: number[] = [];

// ─── SHARED UTILS ────────────────────────────────────────────
export function fmt(s: number): string {
  const m = Math.floor(s / 60),
    sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

export function orm(w: number, r: number): number {
  return r > 1 ? Math.round(w * (1 + r / 30) * 10) / 10 : w;
}

export function fmtDate(d: string): string {
  const dt = new Date(d + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - dt.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `há ${diff} dias`;
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function fmtDur(m: number): string {
  if (!m) return '—';
  return m >= 60
    ? Math.round(m / 60) + 'h' + (m % 60 > 0 ? ' ' + (m % 60) + 'min' : '')
    : m + 'min';
}

export function cleanName(n = ''): string {
  return (n || '').replace(/â[^\s]*/g, '—').replace(/\s+—\s+/g, ' — ').trim() || 'Treino';
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getBestORM(exName: string): number {
  let best = 0;
  _sessionsCache.forEach((s) =>
    s.exercises
      ?.filter((e) => e.name === exName)
      .forEach((e) =>
        (e.setData || []).forEach((ss) => {
          if (ss.w > 0 && ss.r > 0) {
            const v = orm(ss.w, ss.r);
            if (v > best) best = v;
          }
        })
      )
  );
  return best;
}

export function getBestW(exName: string): number {
  let best = 0;
  _sessionsCache.forEach((s) =>
    s.exercises
      ?.filter((e) => e.name === exName)
      .forEach((e) =>
        (e.setData || []).forEach((ss) => {
          if (ss.w > 0 && ss.w > best) best = ss.w;
        })
      )
  );
  return best;
}

export function getHistory(exName: string) {
  return [..._sessionsCache]
    .filter((s) => s.exercises?.some((e) => e.name === exName && (e.setData || []).length > 0))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((s) => {
      const ex = s.exercises.find((e) => e.name === exName)!;
      return { d: s.date, sets: ex.setData || [] };
    });
}

export function getAllSessions(): WorkoutSession[] {
  return [..._sessionsCache].sort((a, b) => b.date.localeCompare(a.date));
}

// ─── DERIVED DATA ─────────────────────────────────────────────
function buildWeekly(sessions: WorkoutSession[]) {
  const weekly: Record<string, any> = {};
  const toLocalKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  sessions.forEach((s) => {
    if (!s.date) return;
    const d = new Date(s.date + 'T12:00:00');
    const dayOfWeek = d.getDay();
    const wkStart = new Date(d);
    wkStart.setDate(d.getDate() - dayOfWeek);
    const wk = toLocalKey(wkStart);
    if (!weekly[wk]) weekly[wk] = { vol: 0, dur: 0, reps: 0, sets: 0, sessions: 0 };
    weekly[wk].vol += s.totalVol || 0;
    weekly[wk].dur += s.duration || 0;
    weekly[wk].sets += s.totalSets || 0;
    weekly[wk].sessions++;
    s.exercises?.forEach((e) =>
      e.setData?.forEach((st) => {
        weekly[wk].reps += st.r || 0;
      })
    );
  });

  const now = new Date();
  const curDay = now.getDay();
  const curWkStart = new Date(now);
  curWkStart.setDate(now.getDate() - curDay);
  const curWk = toLocalKey(curWkStart);
  if (!weekly[curWk]) weekly[curWk] = { vol: 0, dur: 0, reps: 0, sets: 0, sessions: 0 };

  Object.keys(weekly).forEach((k) => {
    weekly[k].vol = Math.round((weekly[k].vol || 0) * 100) / 100;
    weekly[k].label = new Date(k + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  });
  return weekly;
}

function buildExerciseHistory(sessions: WorkoutSession[]) {
  const hist: Record<string, { d: string; sets: any[] }[]> = {};
  const asc = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  asc.forEach((s) => {
    s.exercises?.forEach((e) => {
      if (!hist[e.name]) hist[e.name] = [];
      hist[e.name].push({ d: s.date, sets: e.setData || [] });
    });
  });
  Object.keys(hist).forEach((k) => hist[k].sort((a, b) => b.d.localeCompare(a.d)));
  return hist;
}

export function refreshDerivedData() {
  FEED = getAllSessions();
  WEEKLY = buildWeekly(FEED);
  WEEKS = Object.keys(WEEKLY).sort();
  HIST = buildExerciseHistory(FEED);
  W_DATA = _measureHistoryCache
    .filter((h) => h['Peso'] != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => parseFloat(String(h['Peso'])));
}

export function getWeekStats() {
  const now = new Date();
  const curDay = now.getDay();
  const wkStart = new Date(now);
  wkStart.setDate(now.getDate() - curDay);
  const wkKey = wkStart.toISOString().slice(0, 10);
  const weekSessions = FEED.filter((s) => s.date >= wkKey);
  const totalVol = weekSessions.reduce((a, s) => a + (s.totalVol || 0), 0);
  const totalSets = weekSessions.reduce((a, s) => a + (s.totalSets || 0), 0);
  const avgRpe =
    weekSessions.filter((s) => s.avgRpe).length > 0
      ? weekSessions.filter((s) => s.avgRpe).reduce((a, s) => a + (s.avgRpe || 0), 0) /
        weekSessions.filter((s) => s.avgRpe).length
      : null;
  return {
    sessions: weekSessions.length,
    vol: Math.round(totalVol * 100) / 100,
    sets: totalSets,
    avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
  };
}

// ─── SUPABASE OPERATIONS ─────────────────────────────────────
export async function loadAllUserData() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;

  const [sessRes, measRes, settRes] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('*')
      .order('date', { ascending: false })
      .limit(1000),
    supabase.from('measurements').select('*'),
    supabase.from('user_settings').select('*').eq('user_id', uid).maybeSingle(),
  ]);

  _sessionsCache = (sessRes.data || []).map(rowToSession);
  _measureHistoryCache = (measRes.data || [])
    .map(measureRowToEntry)
    .sort((a, b) => a.date.localeCompare(b.date));
  _weightGoalCache = settRes.data?.weight_goal ?? 74;
  _deloadCache = settRes.data?.deload_config ?? null;

  refreshDerivedData();
  await fetchRoutines();
}

export async function saveSession(session: WorkoutSession) {
  if (_sessionsCache.find((s) => s.id === session.id)) return;
  _sessionsCache = [session, ..._sessionsCache];
  refreshDerivedData();

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;

  const row = sessionToRow(session, uid);
  const { error } = await supabase.from('workout_sessions').insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
  if (error) throw new Error(error.message);
  _sessionsCache = _sessionsCache.filter((s) => s.id !== sessionId);
  refreshDerivedData();
}

export async function refreshSessionsFromServer() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;

  const { data } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);

  if (data) {
    _sessionsCache = data.map(rowToSession);
    refreshDerivedData();
  }
}

// ─── MEASUREMENTS ─────────────────────────────────────────────
export function loadMeasureHistory(): MeasurementEntry[] {
  return _measureHistoryCache;
}

export function loadBodyMeasures(): Partial<MeasurementEntry> {
  for (let i = _measureHistoryCache.length - 1; i >= 0; i--) {
    const h = _measureHistoryCache[i];
    if (Object.keys(h).some((k) => k !== 'date' && k !== 'Peso')) return h;
  }
  return {};
}

export function loadWeightGoal(): number {
  return _weightGoalCache;
}

async function upsertMeasurementRow(uid: string, date: string, newFields: any) {
  const { data: existing } = await supabase
    .from('measurements')
    .select('id,data')
    .eq('user_id', uid)
    .eq('date', date)
    .maybeSingle();

  const merged = { ...(existing?.data || {}), ...newFields };
  if (existing) {
    await supabase.from('measurements').update({ data: merged }).eq('id', existing.id);
  } else {
    await supabase.from('measurements').insert({ user_id: uid, date, data: merged });
  }
}

export async function saveMeasureHistory(h: MeasurementEntry[]) {
  _measureHistoryCache = h;
  refreshDerivedData();
  const newest = h[h.length - 1];
  if (!newest) return;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  const { date, ...fields } = newest;
  await upsertMeasurementRow(uid, date, fields);
}

export async function saveWeight(v: number) {
  const today = new Date().toISOString().slice(0, 10);
  const h = loadMeasureHistory();
  const existing = h.find((r) => r.date === today);
  let newH: MeasurementEntry[];
  if (existing) {
    newH = h.map((r) => (r.date === today ? { ...r, Peso: v } : r));
  } else {
    newH = [...h, { date: today, Peso: v }].sort((a, b) => a.date.localeCompare(b.date));
  }
  await saveMeasureHistory(newH);
}

export async function saveWeightGoal(v: number) {
  _weightGoalCache = v;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  await supabase
    .from('user_settings')
    .upsert({ user_id: uid, weight_goal: v, updated_at: new Date().toISOString() });
}

// ─── ROUTINES ─────────────────────────────────────────────────
let _routinesCache: any[] = [];

export function loadRoutines() {
  return _routinesCache;
}

export async function fetchRoutines() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', uid)
    .order('created_at');
  if (!error) _routinesCache = (data || []).map((r: any) => ({ ...r, exercises: r.exercises || [] }));
}

export async function saveRoutine(routine: any) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;
  const row = {
    user_id: uid,
    name: routine.name,
    label: routine.label,
    color: routine.color || '#3B82F6',
    exercises: routine.exercises,
    updated_at: new Date().toISOString(),
  };
  if (routine.id) {
    await supabase.from('routines').update(row).eq('id', routine.id);
    _routinesCache = _routinesCache.map((r) => (r.id === routine.id ? { ...r, ...row } : r));
    return routine.id;
  } else {
    const { data, error } = await supabase.from('routines').insert({ ...row }).select().single();
    if (!error && data) {
      _routinesCache = [..._routinesCache, data];
      return data.id;
    }
  }
  return null;
}

export async function deleteRoutine(id: string) {
  await supabase.from('routines').delete().eq('id', id);
  _routinesCache = _routinesCache.filter((r) => r.id !== id);
}

// ─── DELOAD ────────────────────────────────────────────────────
export function loadDeload() {
  return _deloadCache;
}

export async function saveDeload(config: any) {
  _deloadCache = config;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  const { error: upErr } = await supabase
    .from('user_settings')
    .update({ deload_config: config, updated_at: new Date().toISOString() })
    .eq('user_id', uid);
  if (upErr) {
    await supabase
      .from('user_settings')
      .insert({ user_id: uid, deload_config: config, updated_at: new Date().toISOString() });
  }
}

// ─── BUILD SETS FROM HISTORY ──────────────────────────────────
export function buildSetsFromHistory(plan: any) {
  const dl = _deloadCache;
  const exercises = plan.exercises.map((ex: any) => {
    const lastSession = [..._sessionsCache]
      .sort((a, b) => b.date.localeCompare(a.date))
      .find((s) => s.exercises?.some((e) => e.name === ex.name));
    const lastSets = lastSession?.exercises?.find((e) => e.name === ex.name)?.setData;
    const baseW = ex.sets[0]?.w || 0;
    const isFirst = !lastSession;
    const warm = isFirst
      ? [
          { w: Math.round((baseW * 0.5) / 2.5) * 2.5, r: 12, done: false, type: 'warmup', rpe: null },
          { w: Math.round((baseW * 0.75) / 2.5) * 2.5, r: 8, done: false, type: 'warmup', rpe: null },
          { w: Math.round((baseW * 0.9) / 2.5) * 2.5, r: 6, done: false, type: 'warmup', rpe: null },
        ]
      : [];
    const srcSets = lastSets || ex.sets || [];
    const workSets = srcSets.map((s: any) => ({ w: s.w || 0, r: s.r || 0, done: false, type: 'work', rpe: null }));
    return { ...ex, activeSets: [...warm, ...workSets] };
  });

  if (dl?.active) {
    const factor = dl.intensity / 100;
    return exercises.map((ex: any) => {
      if (dl.method === 'volume') {
        const ws = ex.activeSets.filter((s: any) => s.type === 'work');
        const wm = ex.activeSets.filter((s: any) => s.type !== 'work');
        return { ...ex, activeSets: [...wm, ...ws.slice(0, Math.max(1, Math.round(ws.length * factor)))], _deload: true };
      }
      if (dl.method === 'intensity' || dl.method === 'technique') {
        return {
          ...ex,
          activeSets: ex.activeSets.map((s: any) =>
            s.type === 'work' ? { ...s, w: s.w ? Math.round(s.w * factor * 2) / 2 : s.w } : s
          ),
          _deload: true,
        };
      }
      return ex;
    });
  }
  return exercises;
}

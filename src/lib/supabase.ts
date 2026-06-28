import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fukbdxzpqrlyjuhbdwin.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uMdPj6RTbeNHxaLkmSiakg_Ti9iNgJQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── TYPES ────────────────────────────────────────────────────
export interface SetData {
  w: number;
  r: number;
  done?: boolean;
  type?: 'work' | 'warmup';
  rpe?: number | null;
}

export interface SessionExercise {
  name: string;
  sets: number;
  bestW: number;
  bestR: number;
  vol: number;
  setData: SetData[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  duration: number;
  exercises: SessionExercise[];
  totalVol: number;
  totalSets: number;
  avgRpe: number | null;
  prs: number;
  calories?: number | null;
  time?: string | null;
}

export interface MeasurementEntry {
  date: string;
  Peso?: number;
  Cintura?: number;
  Quadril?: number;
  Peito?: number;
  Braço?: number;
  Coxa?: number;
  [key: string]: number | string | undefined;
}

// ─── ROW CONVERTERS ──────────────────────────────────────────
export function sessionToRow(s: WorkoutSession, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    date: s.date,
    name: s.name,
    duration: s.duration,
    total_vol: s.totalVol,
    total_sets: s.totalSets,
    avg_rpe: s.avgRpe == null ? null : Number(s.avgRpe),
    prs: s.prs || 0,
    calories: s.calories ?? null,
    time: s.time ?? null,
    exercises: s.exercises,
  };
}

export function rowToSession(r: any): WorkoutSession {
  return {
    id: r.id,
    date: r.date,
    name: r.name,
    duration: r.duration,
    exercises: r.exercises || [],
    totalVol: r.total_vol,
    totalSets: r.total_sets,
    avgRpe: r.avg_rpe,
    prs: r.prs || 0,
    calories: r.calories,
    time: r.time,
  };
}

export function measureRowToEntry(r: any): MeasurementEntry {
  return { date: r.date, ...(r.data || {}) };
}

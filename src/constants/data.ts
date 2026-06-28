// ─── EXERCISE GROUPS ────────────────────────────────────────
export const EX_GROUP: Record<string, string> = {
  'Supino (Barra)': 'Peito',
  'Supino Declinado (Halter)': 'Peito',
  'Supino Inclinado (Halter)': 'Peito',
  'Crucifixo na Polia (Máquina)': 'Peito',
  'Levantamento Terra (Barra)': 'Costas',
  'Barra Fixa': 'Costas',
  'Remada Inclinada Apoiada No Peito (Halter)': 'Costas',
  'Puxada Alta na Polia (Máquina)': 'Costas',
  'Levantamento Terra Romeno (Barra)': 'Costas',
  'Desenvolvimento (Halter)': 'Ombros',
  'Elevação Lateral (Halter)': 'Ombros',
  'Elevação Lateral Unilateral (Cabo)': 'Ombros',
  'Aberturas Invertidas De Ombro Posterior (Na Máquina)': 'Ombros',
  'Agachamento (Barra)': 'Pernas',
  'Leg Press 45º (Máquina)': 'Pernas',
  'Mesa Flexora (Máquina)': 'Pernas',
  'Afundo (Halter)': 'Pernas',
  'Elevação de Panturrilha Sentado (Máquina)': 'Pernas',
  'Elevação Unilateral de Panturrilha em Pé (Máquina)': 'Pernas',
  'Rosca Direta na Barra W': 'Biceps',
  'Rosca Scott (Barra)': 'Biceps',
  'Rosca Inclinada (Halter)': 'Biceps',
  'Rosca Martelo (Halter)': 'Biceps',
  'Tríceps na Paralela (Com Peso)': 'Triceps',
  'Extensão de tríceps acima da cabeça (cabo)': 'Triceps',
  'Abdominal (Corda)': 'Core',
  'Abdominal Na Máquina': 'Core',
};

export const MUSCLE_KEYWORDS: Record<string, string[]> = {
  Peito: ['Supino', 'Crucifixo', 'Peitoral', 'Inclinado', 'Declinado'],
  Costas: ['Terra', 'Remada', 'Puxada', 'Barra Fixa', 'Pull'],
  Pernas: ['Agachamento', 'Leg Press', 'Cadeira', 'Mesa Flexora', 'Afundo'],
  Ombros: ['Desenvolvimento', 'Elevação Lateral', 'Aberturas', 'Arnold'],
  Braços: ['Rosca', 'Tríceps', 'Martelo', 'Scott', 'Concentrada', 'Extensão'],
  Core: ['Abdominal', 'Core', 'Prancha', 'Elevação De Pernas'],
  Glúteos: ['Romeno', 'Hip Thrust', 'Glúteo'],
  Panturrilha: ['Panturrilha', 'Elevação de Panturrilha', 'Calf'],
};

export function getExMuscle(exName: string): string | null {
  const n = exName.toLowerCase();
  for (const [g, kws] of Object.entries(MUSCLE_KEYWORDS)) {
    if (kws.some((kw) => n.includes(kw.toLowerCase()))) return g;
  }
  return null;
}

export const RPE_LABELS: Record<number, string> = {
  6: 'Muito fácil',
  6.5: 'Fácil',
  7: 'Leve',
  7.5: 'Moderado',
  8: 'Difícil',
  8.5: 'Muito difícil',
  9: 'Quase máximo',
  9.5: 'Máximo',
  10: 'Falha',
};

// ─── ALL EXERCISES ────────────────────────────────────────────
export const ALL_EXERCISES: Record<string, string[]> = {
  Peito: [
    'Supino (Barra)',
    'Supino Declinado (Halter)',
    'Supino Inclinado (Halter)',
    'Crucifixo na Polia (Máquina)',
  ],
  Costas: [
    'Levantamento Terra (Barra)',
    'Barra Fixa',
    'Remada Inclinada Apoiada No Peito (Halter)',
    'Puxada Alta na Polia (Máquina)',
    'Levantamento Terra Romeno (Barra)',
  ],
  Ombros: [
    'Desenvolvimento (Halter)',
    'Elevação Lateral (Halter)',
    'Elevação Lateral Unilateral (Cabo)',
    'Aberturas Invertidas De Ombro Posterior (Na Máquina)',
  ],
  Pernas: [
    'Agachamento (Barra)',
    'Leg Press 45º (Máquina)',
    'Mesa Flexora (Máquina)',
    'Extensora (Máquina)',
    'Afundo (Halter)',
    'Elevação de Panturrilha Sentado (Máquina)',
    'Elevação Unilateral de Panturrilha em Pé (Máquina)',
  ],
  Biceps: [
    'Rosca Direta na Barra W',
    'Rosca Scott (Barra)',
    'Rosca Inclinada (Halter)',
    'Rosca Martelo (Halter)',
  ],
  Triceps: [
    'Tríceps na Paralela (Com Peso)',
    'Extensão de tríceps acima da cabeça (cabo)',
  ],
  Core: ['Abdominal (Corda)', 'Abdominal Na Máquina'],
};

// ─── DEFAULT PLANS (5-day split) ─────────────────────────────
export interface SetData {
  w: number;
  r: number;
  done?: boolean;
  type?: 'work' | 'warmup';
  rpe?: number | null;
}

export interface PlanExercise {
  name: string;
  group: string;
  rest: number;
  sets: SetData[];
  warmup?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  label: string;
  color: string;
  exercises: PlanExercise[];
}

export const PLANS: Plan[] = [
  {
    id: 'd1',
    name: 'DIA 1',
    label: 'Push',
    color: '#2B4C8C',
    exercises: [
      {
        name: 'Supino (Barra)',
        group: 'Peito',
        rest: 180,
        sets: [{ w: 55, r: 5 }, { w: 55, r: 5 }, { w: 55, r: 5 }],
        warmup: true,
      },
      {
        name: 'Supino Declinado (Halter)',
        group: 'Peito',
        rest: 120,
        sets: [{ w: 23, r: 9 }, { w: 23, r: 9 }, { w: 23, r: 9 }],
      },
      {
        name: 'Crucifixo na Polia (Máquina)',
        group: 'Peito',
        rest: 90,
        sets: [{ w: 15, r: 12 }, { w: 15, r: 12 }, { w: 15, r: 12 }],
      },
      {
        name: 'Tríceps na Paralela (Com Peso)',
        group: 'Triceps',
        rest: 120,
        sets: [{ w: 0, r: 8 }, { w: 0, r: 8 }, { w: 0, r: 8 }],
        warmup: true,
      },
      {
        name: 'Elevação Lateral Unilateral (Cabo)',
        group: 'Ombros',
        rest: 90,
        sets: [{ w: 10, r: 12 }, { w: 10, r: 12 }, { w: 10, r: 12 }],
        warmup: true,
      },
    ],
  },
  {
    id: 'd2',
    name: 'DIA 2',
    label: 'Pull + Bíceps',
    color: '#10B981',
    exercises: [
      {
        name: 'Levantamento Terra (Barra)',
        group: 'Costas',
        rest: 180,
        sets: [{ w: 72, r: 6 }, { w: 72, r: 6 }, { w: 72, r: 6 }],
        warmup: true,
      },
      {
        name: 'Barra Fixa',
        group: 'Costas',
        rest: 150,
        sets: [{ w: 0, r: 6 }, { w: 0, r: 6 }, { w: 0, r: 6 }],
      },
      {
        name: 'Remada Inclinada Apoiada No Peito (Halter)',
        group: 'Costas',
        rest: 120,
        sets: [{ w: 23, r: 8 }, { w: 23, r: 8 }, { w: 23, r: 8 }],
      },
      {
        name: 'Rosca Direta na Barra W',
        group: 'Biceps',
        rest: 90,
        sets: [{ w: 22, r: 8 }, { w: 22, r: 8 }, { w: 22, r: 8 }],
        warmup: true,
      },
      {
        name: 'Abdominal (Corda)',
        group: 'Core',
        rest: 60,
        sets: [{ w: 47, r: 13 }, { w: 47, r: 13 }, { w: 47, r: 13 }],
      },
    ],
  },
  {
    id: 'd3',
    name: 'DIA 3',
    label: 'Legs',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Agachamento (Barra)',
        group: 'Pernas',
        rest: 180,
        sets: [{ w: 55, r: 5 }, { w: 55, r: 5 }, { w: 55, r: 5 }],
        warmup: true,
      },
      {
        name: 'Leg Press 45º (Máquina)',
        group: 'Pernas',
        rest: 150,
        sets: [{ w: 110, r: 9 }, { w: 110, r: 9 }, { w: 110, r: 9 }],
      },
      {
        name: 'Mesa Flexora (Máquina)',
        group: 'Pernas',
        rest: 90,
        sets: [{ w: 35, r: 9 }, { w: 35, r: 9 }, { w: 35, r: 9 }],
      },
      {
        name: 'Extensora (Máquina)',
        group: 'Pernas',
        rest: 90,
        sets: [{ w: 40, r: 12 }, { w: 40, r: 12 }, { w: 40, r: 12 }],
      },
      {
        name: 'Elevação Unilateral de Panturrilha em Pé (Máquina)',
        group: 'Pernas',
        rest: 60,
        sets: [{ w: 48, r: 14 }, { w: 48, r: 14 }, { w: 48, r: 14 }],
      },
    ],
  },
  {
    id: 'd4',
    name: 'DIA 4',
    label: 'Ombros + Upper',
    color: '#A78BFA',
    exercises: [
      {
        name: 'Desenvolvimento (Halter)',
        group: 'Ombros',
        rest: 150,
        sets: [{ w: 24, r: 8 }, { w: 24, r: 8 }, { w: 24, r: 8 }],
        warmup: true,
      },
      {
        name: 'Puxada Alta na Polia (Máquina)',
        group: 'Costas',
        rest: 120,
        sets: [{ w: 52, r: 9 }, { w: 52, r: 9 }, { w: 52, r: 9 }],
        warmup: true,
      },
      {
        name: 'Elevação Lateral (Halter)',
        group: 'Ombros',
        rest: 90,
        sets: [{ w: 12, r: 11 }, { w: 12, r: 11 }, { w: 12, r: 11 }],
      },
      {
        name: 'Aberturas Invertidas De Ombro Posterior (Na Máquina)',
        group: 'Ombros',
        rest: 60,
        sets: [{ w: 32, r: 11 }, { w: 32, r: 11 }, { w: 32, r: 11 }],
      },
      {
        name: 'Extensão de tríceps acima da cabeça (cabo)',
        group: 'Triceps',
        rest: 60,
        sets: [{ w: 25, r: 8 }, { w: 25, r: 8 }, { w: 25, r: 8 }],
      },
      {
        name: 'Abdominal Na Máquina',
        group: 'Core',
        rest: 60,
        sets: [{ w: 48, r: 12 }, { w: 48, r: 12 }, { w: 48, r: 12 }],
      },
    ],
  },
  {
    id: 'd5',
    name: 'DAY 5',
    label: 'Legs + Bíceps',
    color: '#F472B6',
    exercises: [
      {
        name: 'Levantamento Terra Romeno (Barra)',
        group: 'Costas',
        rest: 120,
        sets: [{ w: 47, r: 7 }, { w: 47, r: 7 }, { w: 47, r: 7 }],
        warmup: true,
      },
      {
        name: 'Afundo (Halter)',
        group: 'Pernas',
        rest: 90,
        sets: [{ w: 16, r: 12 }, { w: 16, r: 12 }, { w: 16, r: 12 }],
      },
      {
        name: 'Elevação de Panturrilha Sentado (Máquina)',
        group: 'Pernas',
        rest: 60,
        sets: [{ w: 42, r: 13 }, { w: 42, r: 13 }, { w: 42, r: 13 }],
      },
      {
        name: 'Rosca Scott (Barra)',
        group: 'Biceps',
        rest: 90,
        sets: [{ w: 20, r: 8 }, { w: 20, r: 8 }, { w: 20, r: 8 }],
        warmup: true,
      },
      {
        name: 'Rosca Martelo (Halter)',
        group: 'Biceps',
        rest: 90,
        sets: [{ w: 12, r: 10 }, { w: 12, r: 10 }, { w: 12, r: 10 }],
      },
    ],
  },
];

// ─── EXERCISE DB IDS (for GIF API) ────────────────────────────
export const EXERCISE_IDS: Record<string, string> = {
  'Supino (Barra)': '0025',
  'Supino Declinado (Halter)': '0033',
  'Supino Inclinado (Halter)': '0047',
  'Crucifixo na Polia (Máquina)': '0155',
  'Levantamento Terra (Barra)': '0032',
  'Barra Fixa': '0652',
  'Remada Inclinada Apoiada No Peito (Halter)': '0327',
  'Puxada Alta na Polia (Máquina)': '0198',
  'Levantamento Terra Romeno (Barra)': '0085',
  'Desenvolvimento (Halter)': '0405',
  'Elevação Lateral (Halter)': '0334',
  'Elevação Lateral Unilateral (Cabo)': '0192',
  'Aberturas Invertidas De Ombro Posterior (Na Máquina)': '0154',
  'Agachamento (Barra)': '0043',
  'Leg Press 45º (Máquina)': '0739',
  'Mesa Flexora (Máquina)': '0586',
  'Extensora (Máquina)': '0585',
  'Afundo (Halter)': '0336',
  'Elevação de Panturrilha Sentado (Máquina)': '0594',
  'Elevação Unilateral de Panturrilha em Pé (Máquina)': '0605',
  'Rosca Direta na Barra W': '0031',
  'Rosca Scott (Barra)': '0070',
  'Rosca Inclinada (Halter)': '0072',
  'Rosca Martelo (Halter)': '0313',
  'Tríceps na Paralela (Com Peso)': '0019',
  'Extensão de tríceps acima da cabeça (cabo)': '0194',
  'Abdominal (Corda)': '0226',
  'Abdominal Na Máquina': '0595',
};

export const RAPIDAPI_KEY = '863ed60540msha869e2cf0791bd5p1ccf0cjsn2febf3210d99';

// ─── EXERCISE INFO ────────────────────────────────────────────
export interface ExerciseInfo {
  group: string;
  secondary: string[];
  type: string;
  equipment: string;
  muscles: string[];
  instructions: string[];
  tips: string;
}

export const EXERCISES_INFO: Record<string, ExerciseInfo> = {
  'Supino (Barra)': {
    group: 'Peito',
    secondary: ['Tríceps', 'Ombros'],
    type: 'Composto',
    equipment: 'Barra + Banco',
    muscles: ['Peitoral maior', 'Tríceps braquial', 'Deltoide anterior'],
    instructions: [
      'Deite no banco com olhos abaixo da barra. Pegada levemente mais larga que os ombros.',
      'Retire a barra com braços estendidos, alinhada ao peito.',
      'Desça controlado até tocar o peito, cotovelos a 45-75°.',
      'Empurre de volta em linha reta até extensão completa.',
    ],
    tips: 'Mantenha escápulas retraídas e pés firmes no chão durante todo o movimento.',
  },
  'Levantamento Terra (Barra)': {
    group: 'Costas',
    secondary: ['Pernas', 'Core'],
    type: 'Composto',
    equipment: 'Barra',
    muscles: ['Latíssimo do dorso', 'Trapézio', 'Glúteo máximo', 'Isquiotibiais'],
    instructions: [
      'Barra sobre os metatarsos. Pegada na largura dos ombros.',
      'Quadril para baixo, peito para fora, barra encostada na perna.',
      'Empurre o chão mantendo a barra colada ao corpo.',
      'Estenda quadril e joelhos simultaneamente.',
    ],
    tips: 'A barra deve raspar a canela na subida.',
  },
  'Agachamento (Barra)': {
    group: 'Pernas',
    secondary: ['Core', 'Costas'],
    type: 'Composto',
    equipment: 'Barra + Rack',
    muscles: ['Quadríceps', 'Glúteo máximo', 'Isquiotibiais'],
    instructions: [
      'Barra apoiada nos trapézios, pés na largura dos ombros.',
      'Desça mantendo joelhos alinhados com os pés.',
      'Coxa paralela ou abaixo do paralelo com o chão.',
      'Empurre de volta através dos calcanhares.',
    ],
    tips: 'Respire fundo antes de descer e expire no esforço.',
  },
};

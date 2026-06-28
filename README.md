# Carbon — React Native (Expo)

App mobile do Carbon Fitness Tracker, reescrito em React Native com Expo para publicação na App Store.

## Stack

- **Expo** (managed workflow, SDK 51)
- **Expo Router** (file-based navigation)
- **Supabase JS** (banco de dados + autenticação)
- **React Native SVG** (gráficos)
- **React Native Gesture Handler / Reanimated**

---

## Setup

### 1. Instalar dependências

```bash
cd CarbonRN
npm install
```

### 2. Criar assets (imagens mínimas necessárias)

Expo precisa de alguns assets para rodar. Crie a pasta `assets/` com:

- `icon.png` (1024×1024)
- `splash.png` (1284×2778)
- `adaptive-icon.png` (1024×1024)

Pode usar imagens placeholder por enquanto ou copiar do projeto web em `Carbon-app/public/carbon-logo.png`.

```bash
mkdir -p assets
cp ../Carbon-app/public/carbon-logo.png assets/icon.png
cp ../Carbon-app/public/carbon-splash.png assets/splash.png
cp ../Carbon-app/public/carbon-logo.png assets/adaptive-icon.png
```

### 3. Rodar no simulador

```bash
npx expo start
```

Depois pressione:
- `i` para iOS Simulator
- `a` para Android Emulator
- Escaneie o QR code com o app Expo Go no celular

---

## Estrutura do Projeto

```
CarbonRN/
├── app/                          # Rotas (Expo Router)
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Redirect (auth check)
│   ├── auth.tsx                  # Login / Signup
│   ├── exercicios.tsx            # Browser de exercícios + GIFs
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom navigation Carbon
│   │   ├── index.tsx             # HOME - resumo, histórico
│   │   ├── treino.tsx            # TREINO - seleção de plano
│   │   ├── progresso.tsx         # PROGRESSO - gráficos
│   │   ├── corpo.tsx             # CORPO - medidas
│   │   └── coach.tsx             # COACH - sugestões, deload
│   └── treino/
│       └── [planId].tsx          # Treino ativo (timer, séries)
│
├── src/
│   ├── constants/
│   │   ├── theme.ts              # Design system (cores Carbon)
│   │   └── data.ts               # Exercícios, planos, IDs ExerciseDB
│   ├── lib/
│   │   ├── supabase.ts           # Client + tipos
│   │   └── store.ts              # Cache em memória + funções Supabase
│   ├── hooks/
│   │   └── useAuth.tsx           # Context de autenticação
│   └── components/
│       └── shared/
│           └── GlassCard.tsx     # Componentes reutilizáveis
│
├── assets/                       # Ícones, splash screen
├── app.json                      # Config Expo
├── babel.config.js
└── package.json
```

---

## Configurações (já embutidas no código)

| Config | Valor |
|--------|-------|
| Supabase URL | `https://fukbdxzpqrlyjuhbdwin.supabase.co` |
| Supabase Key | `sb_publishable_uMdPj6RTbeNHxaLkmSiakg_Ti9iNgJQ` |
| RapidAPI Key | `863ed60540msha869e2cf0791bd5p1ccf0cjsn2febf3210d99` |

---

## Funcionalidades Implementadas

### ✅ Telas completas
- **Home** — saudação, stats da semana, volume progress, início rápido de treino, histórico de sessões
- **Treino** — seleção de planos 5 dias, acesso por músculo, rotinas customizadas
- **Treino Ativo** — registro de séries com peso/reps, timer de descanso, RPE por série, warmup automático, sistema de deload
- **Progresso** — gráfico de volume semanal, evolução de peso, distribuição muscular, listagem de sessões
- **Corpo** — entrada de peso diário, meta de peso, medidas corporais, gráfico de evolução
- **Coach** — sinais de fadiga, sugestões, gerenciamento de semana de deload
- **Exercícios** — browse com busca e filtro por grupo, GIFs via ExerciseDB API, instruções e histórico por exercício
- **Auth** — login e signup com Supabase Auth

### ✅ Dados
- Mesmo Supabase do app web (sessões, medidas, user_settings, routines)
- Cache em memória idêntico ao web (FEED, WEEKLY, HIST, W_DATA)
- Conversão de rows Supabase para o formato Carbon

### ✅ Design
- Fundo `#080A0E`, azul `#2563EB`
- Bottom navigation estilo Carbon (pill ativa)
- Cards com glass effect
- Cores por grupo muscular

---

## Próximos Passos

1. **Copiar assets** do projeto web para a pasta `assets/`
2. `npm install`
3. `npx expo start`
4. Testar login com conta existente do Supabase
5. Publicar com `eas build` (precisa de conta Expo EAS)

---

## Publicar na App Store

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar
eas build:configure

# Build iOS
eas build --platform ios

# Submit
eas submit --platform ios
```

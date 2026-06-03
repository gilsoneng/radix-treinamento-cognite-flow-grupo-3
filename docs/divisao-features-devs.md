# Divisão de Features por Dev — Painel de Action Items (Checklists)

> Plano de trabalho derivado de [SPEC.md](../SPEC.md), [CLAUDE.md](../CLAUDE.md) e [specs/design.md](../specs/design.md).
> Time de **4 devs** (DEV 1 a DEV 4). App **somente leitura** sobre o data model real
> `cdf_apm.ApmAppData:v13` (views verificadas: `Checklist@v7`, `ChecklistItem@v7`,
> `MeasurementReading@v4`, `Asset@v2`, `CDF_User@v1`), instâncias no space
> `cognite-flows-grupo-3`.

---

## 0. Ponto de partida — o que JÁ está pronto

A camada de **leitura de dados** está implementada e testada. Ninguém precisa reescrevê-la;
todos consomem o ponto único de composição.

| Arquivo | Papel | Status |
| --- | --- | --- |
| [src/types/apm.ts](../src/types/apm.ts) | Entidades de domínio normalizadas (`Checklist`, `ChecklistItem`, `MeasurementReading`, `AssetSummary`, `CdfUser`) | ✅ |
| [src/services/group3/model-ids.ts](../src/services/group3/model-ids.ts) | IDs de views/edges + `INSTANCE_SPACE` | ✅ |
| [src/services/group3/cdf-instance-types.ts](../src/services/group3/cdf-instance-types.ts) | Tipos das instâncias DMS + type guards | ✅ |
| [src/services/group3/apm-mapper.ts](../src/services/group3/apm-mapper.ts) | Mapper puro DMS → domínio (resolve edges/relations) | ✅ |
| [src/services/group3/checklist-data-gateway.ts](../src/services/group3/checklist-data-gateway.ts) | Porta (interface) de leitura | ✅ |
| [src/services/group3/cognite-checklist-data-gateway.ts](../src/services/group3/cognite-checklist-data-gateway.ts) | Adapter SDK (`client.instances.list`, paginação) | ✅ |
| [src/services/group3/group3-data-service.ts](../src/services/group3/group3-data-service.ts) | `Group3DataService` (read-only) | ✅ |
| [src/services/group3/index.ts](../src/services/group3/index.ts) | `createGroup3DataService(client)` — composition root | ✅ |

**Contrato que todos consomem** (não alterar a assinatura sem alinhar com o time):

```typescript
import { createGroup3DataService } from './services/group3';
import type { Group3DataService } from './services/group3';

// client = CogniteClient de useCogniteSdk()
const service: Group3DataService = createGroup3DataService(client);

service.getChecklists();          // Promise<Checklist[]>  — itens + medições aninhados
service.getChecklistItems();      // Promise<ChecklistItem[]>
service.getMeasurementReadings(); // Promise<MeasurementReading[]>
service.getAssets();              // Promise<AssetSummary[]>
service.getUsers();               // Promise<CdfUser[]>
```

> ⚠️ O service entrega o domínio **cru-normalizado** (status como `string`, sem KPIs, sem
> classificação de "Atrasado"). A semântica de produto é responsabilidade da **DEV 2**.

### O que falta (todo o frontend)

`App.tsx` ainda é o boilerplate "Welcome to Flows". Falta: integração com host, estado
sincronizado, ViewModels, lógica de domínio (status/SLA/KPIs/filtros/ordenação/busca),
dashboard de KPIs, tabela de Checklists, drawer de detalhe e auto-refresh. É exatamente
isso que as quatro frentes abaixo cobrem.

---

## 1. Visão geral da divisão

```
┌──────────────────────────────────────────────────────────────────────┐
│  DEV 1 — Plataforma / Host / Estado sincronizado / Shell + Auto-refresh │  ← base de todos
├──────────────────────────────────────────────────────────────────────┤
│  DEV 2 — Lógica de domínio pura (status, SLA, KPIs, filtros, ordenação) │  ← motor de todos
├───────────────────────────────────┬──────────────────────────────────┤
│  DEV 3 — Dashboard KPIs +          │  DEV 4 — Tabela de Checklists +    │
│          barra de Filtros/Busca/   │          Drawer de detalhe         │
│          Ordenação (UI + VMs)      │          (UI + VMs)                │
└───────────────────────────────────┴──────────────────────────────────┘
```

- **DEV 1** e **DEV 2** não dependem de ninguém (só do §0) e **começam imediatamente**.
- **DEV 3** e **DEV 4** dependem dos **contratos** publicados por DEV 1 e DEV 2 — não da
  implementação. Por isso os contratos (§6) são definidos **no dia 1** e DEV 3/4 codam
  contra mocks/stubs (test-first, [CLAUDE.md §6](../CLAUDE.md)).

| Dev | Frente | FRs cobertos |
| --- | --- | --- |
| DEV 1 | Plataforma, host-sync, data hook, shell, auto-refresh, estados globais | FR-008, FR-011, FR-012, FR-013 |
| DEV 2 | Domínio puro: status, "atrasado", SLA, KPIs, prioridade, área, filtros, ordenação, busca, janela 30d | FR-002, FR-004, FR-006, FR-009, FR-010, FR-014 |
| DEV 3 | Dashboard de KPIs + barra de filtros/ordenação/busca | FR-002, FR-005, FR-006, FR-010, FR-014, FR-015 |
| DEV 4 | Lista/tabela de Checklists + drawer de detalhe + destaque de atrasados | FR-001, FR-003, FR-004, FR-005, FR-007, FR-015 |

Princípios obrigatórios para todos: **ViewModel pattern** ([CLAUDE.md §5](../CLAUDE.md)),
**Dependency Injection** (§3), **Aura primeiro** (§1), **test-first** (§6),
**sem `any`/`as`** (§7).

---

## DEV 1 — Plataforma, Host & Estado sincronizado (a "fundação")

**Missão.** Montar o esqueleto onde DEV 3 e DEV 4 plugam suas telas: integração com o host
Fusion, a store de estado sincronizado, o hook de dados com auto-refresh e os estados
globais de loading/erro/vazio. É o dev "desbloqueador" — publica contratos cedo.

### Escopo / responsabilidades

1. **Integração com o host** ([CLAUDE.md §2](../CLAUDE.md), FR-013)
   - `connectToHostApp({ applicationName: 'xpto-app' })` no bootstrap, obtendo `api` e
     `initialState`.
   - `HostAppApiProvider` (React context) que expõe `api` a toda a árvore — ViewModels
     dependem dele por contexto (DI, §3). Nunca ler `window.location` nem hardcodar URL.

2. **Estado sincronizado com o host** (FR-011, CLAUDE.md §2 e §5)
   - Definir o tipo `AppState` (ver §6) e um **StateProvider/store** único renderizado na
     raiz (a store de estado compartilhada que os ViewModels de DEV 3/4 consomem).
   - **Seed** a partir de `initialState` no startup; em cada mudança, `JSON.stringify` +
     `api.syncInternalState(...)`. Garantir que reload e link compartilhado restauram
     visão ativa, filtros, ordenação, busca e ronda selecionada.
   - Expor um hook `useAppState()` (getter + setters semânticos: `setActiveView`,
     `setFilters`, `setSort`, `setSearch`, `selectChecklist`, `closeDetail`, ...).

3. **Hook de dados + auto-refresh** (FR-008, FR-013)
   - `useChecklistData()` sobre **@tanstack/react-query** (já é dependência), consumindo
     `createGroup3DataService(useCogniteSdk())`.
   - `refetchInterval ≈ 30s` (constante configurável), `refresh()` manual, e
     `lastUpdatedAt` (timestamp da última atualização bem-sucedida).
   - Injeção do service via contexto/factory (§3) para ser testável sem rede.

4. **Shell do app + estados globais** (FR-012, FR-015)
   - Reescrever [src/App.tsx](../src/App.tsx): compor providers (`CogniteSdkProvider` já
     existe → adicionar `QueryClientProvider`, `HostAppApiProvider`, `StateProvider`) e o
     layout raiz (topbar/área de conteúdo) que hospeda Dashboard (DEV 3) e Lista (DEV 4).
   - Estados **carregando** (`Loader`), **erro** (`Alert`) e **vazio** com componentes
     Aura, sem travar a UI. Exibir o "última atualização" e o botão de refresh manual no
     shell (a lógica vem do hook; o visual pode ser combinado com DEV 3).
   - Aplicar o brand theme ([specs/design.md](../specs/design.md)) via tokens, não hex cru.

### Arquivos (sugestão)

```
src/App.tsx                                  (reescrever)
src/platform/host/host-app-api-provider.tsx  + .test.tsx
src/platform/host/use-host-app-api.ts
src/platform/state/app-state.ts              (tipo AppState + DEFAULT_STATE)
src/platform/state/state-provider.tsx        + .test.tsx
src/platform/state/use-app-state.ts          + .test.ts
src/platform/data/use-checklist-data.ts      + .test.ts
src/platform/data/query-client.ts
```

### Contratos que DEV 1 PUBLICA (dia 1)

`AppState` (§6), `useAppState()`, `useChecklistData()` e `useHostAppApi()`. DEV 3 e DEV 4
programam contra essas assinaturas.

### Testes mínimos ([CLAUDE.md §6](../CLAUDE.md))

- StateProvider: seed a partir de `initialState`; cada setter chama `syncInternalState`
  com o JSON correto; round-trip (reload restaura).
- `useChecklistData`: estados loading/success/error; `lastUpdatedAt` atualiza; `refresh()`
  refaz a busca; polling agendado (timer injetado).
- App shell: renderiza loading/erro/vazio corretos.

### Done quando

Providers no lugar, estado sobrevive a reload/link compartilhado, dados carregam e
revalidam a cada ~30s com refresh manual e "última atualização" visíveis, e DEV 3/4
conseguem montar suas telas dentro do shell.

---

## DEV 2 — Lógica de domínio pura (o "motor")

> **Handoff implementado:** [dev2-dominio-handoff.md](./dev2-dominio-handoff.md) — guia de consumo
> para DEV 1/3/4 (`src/domain`, pipeline, KPIs duplos, decisões de prazo/status).

**Missão.** Transformar o domínio cru do service em **semântica de produto**: classificar
status, identificar atrasados, calcular SLA e KPIs, e fornecer filtros/ordenação/busca.
Tudo **funções puras** (sem React, sem SDK) — a camada mais testável do app.

### Escopo / responsabilidades

1. **Classificação de status** (FR-004)
   - `classifyStatus(c, now) → 'aberto' | 'em_andamento' | 'atrasado' | 'concluido'`.
   - Regra: **Atrasado = prazo vencido E não concluído**. Mapear os valores crus de
     `Checklist.status` (string da view) para os 4 baldes; documentar o mapeamento.

2. **Prazo, "atrasado" e SLA** (FR-002c, FR-004)
   - `isOverdue(c, now) → boolean`.
   - `slaOnTimePercent(cs, now) → number` (% concluído no prazo). Definir o que conta como
     "no prazo" (concluída antes do `endTime`).

3. **KPIs / agregações** (FR-002)
   - `computeKpis(cs, now) → Kpis` com: abertos, atrasados, % no prazo (SLA), distribuição
     por status, por prioridade e por área/ativo. Estrutura em §6.

4. **Prioridade e área (derivações)** (Clarifications da SPEC)
   - `derivePriority(c) → 'alta' | 'media' | 'baixa'`: a `Checklist@v7` **não tem
     prioridade nativa** → derivar (ex.: atraso + criticidade do ativo + labels).
     Documentar a heurística escolhida.
   - `deriveArea(c) → string | null`: área a partir de `rootLocation` (AssetSummary) da
     Checklist; fallback para `asset` dos itens. Documentar a fonte.

5. **Filtros, busca, ordenação, janela** (FR-006, FR-009, FR-010, FR-014)
   - `applyFilters(cs, filters, now)`: status, prazo ("somente atrasados"), prioridade,
     área — **combináveis**.
   - `isWithinPeriod(c, period, now)`: janela padrão = **abertos + últimos 30 dias**
     (FR-009).
   - `applySearch(cs, query)`: por título e/ou ativo (FR-014).
   - `sortChecklists(cs, sort, now)`: no mínimo por **prazo** e por **status** (FR-010).

> Os KPIs devem refletir a lista **após** filtros/busca (FR-006). Definir com DEV 3 se a
> agregação recebe a lista já filtrada (recomendado) ou aplica os filtros internamente.

### Arquivos (sugestão)

```
src/domain/status.ts          + .test.ts   (classifyStatus, isOverdue, StatusBucket)
src/domain/sla.ts             + .test.ts   (slaOnTimePercent)
src/domain/kpis.ts            + .test.ts   (computeKpis, Kpis)
src/domain/priority.ts        + .test.ts   (derivePriority)
src/domain/area.ts            + .test.ts   (deriveArea)
src/domain/filters.ts         + .test.ts   (applyFilters, isWithinPeriod, Filters, Period)
src/domain/search.ts          + .test.ts   (applySearch)
src/domain/sort.ts            + .test.ts   (sortChecklists, SortKey, SortDir)
src/domain/index.ts                        (barrel)
```

### Contratos que DEV 2 PUBLICA (dia 1)

Assinaturas das funções acima + os tipos `StatusBucket`, `Priority`, `Kpis`, `Filters`,
`Period`, `SortKey`, `SortDir` (§6). DEV 1 reusa `Filters/SortKey/...` dentro de
`AppState`; DEV 3 consome `computeKpis`/`applyFilters`/`applySearch`/`sortChecklists`.

### Testes mínimos ([CLAUDE.md §6](../CLAUDE.md))

Cobertura por função e por ramo: cada balde de status; fronteira de atraso (`endTime`
exatamente = `now`); SLA com 0 itens, todos no prazo, todos atrasados; filtros
combinados; busca case-insensitive/acento; ordenação asc/desc estável; janela 30d.
Usar `now` **injetado** (nunca `Date.now()` direto, §3).

### Done quando

Dada uma lista de `Checklist`, o time consegue obter KPIs, lista filtrada/buscada/ordenada
e a classificação de cada ronda — tudo puro, 100% coberto por testes, sem dependência de
UI ou SDK.

---

## DEV 3 — Dashboard de KPIs + Barra de Filtros / Ordenação / Busca

**Missão.** A "visão de pulso da operação": cards de KPI no topo e os controles que
recortam a operação. ViewModels finos compondo DEV 1 (estado + dados) e DEV 2 (motor);
componentes só renderizam.

### Escopo / responsabilidades

1. **Dashboard de KPIs** (FR-002, FR-005)
   - Cards Aura: abertos, atrasados, % no prazo (SLA), distribuição por status, por
     prioridade e por área/ativo.
   - **Atrasados** sempre com **texto/ícone além da cor** (acessibilidade, design.md).
   - `useDashboardViewModel`: lê `useChecklistData()` + `useAppState()` (DEV 1), aplica
     `applyFilters`/`applySearch` e `computeKpis` (DEV 2). KPIs refletem os filtros ativos.

2. **Barra de filtros** (FR-006) — combináveis, refletidos nos KPIs e na lista (DEV 4)
   - Status (multi), prazo incl. "somente atrasados", prioridade, área/ativo, período
     (default 30d). Cada mudança vai para `setFilters` (DEV 1) → host-sync.

3. **Ordenação e busca** (FR-010, FR-014)
   - Controle de ordenação (prazo, status; asc/desc) → `setSort`.
   - Campo de busca textual (título/ativo) → `setSearch` (debounce local apenas no input;
     o valor aplicado vive no estado host-synced).

4. **Alternância de visão** (dashboard/lista) → `setActiveView`, se o layout usar abas.

> Filtros, ordenação, busca e visão ativa são **estado host-synced** (FR-011): manipular
> **sempre** via setters do `useAppState` (DEV 1), nunca `useState` local. Input em
> digitação antes de aplicar pode ser local (CLAUDE.md §2).

### Arquivos (sugestão)

```
src/features/dashboard/use-dashboard-view-model.ts  + .test.ts
src/features/dashboard/dashboard.tsx                + .test.tsx
src/features/dashboard/kpi-card.tsx                 + .test.tsx
src/features/filters/use-filters-view-model.ts      + .test.ts
src/features/filters/filters-bar.tsx                + .test.tsx
src/features/filters/sort-control.tsx
src/features/filters/search-box.tsx
```

### Depende de

- **DEV 1**: `useAppState()`, `useChecklistData()` (contratos §6).
- **DEV 2**: `computeKpis`, `applyFilters`, `applySearch`, tipos `Kpis`/`Filters`.

Enquanto DEV 1/2 finalizam, codar contra **mocks dos contratos** (test-first).

### Testes mínimos

- ViewModel: estados loading/erro/sucesso; KPIs derivados corretos; mudança de filtro
  recomputa KPIs.
- Filtro "somente atrasados" + área → KPIs refletem só aquele recorte (Acceptance
  "Filtro combinável").
- Atrasado destacado com texto/ícone (não só cor).

### Done quando

O gerente vê KPIs corretos em segundos, aplica filtros combináveis / ordena / busca, e
tudo persiste em reload e link compartilhado (via estado host-synced).

---

## DEV 4 — Lista/Tabela de Checklists + Drawer de Detalhe

**Missão.** O coração operacional: a tabela das rondas com destaque de atrasados e o
detalhe que abre os ChecklistItems de uma ronda. ViewModels compondo DEV 1 + DEV 2;
componentes só renderizam.

### Escopo / responsabilidades

1. **Lista/tabela de Checklists** (FR-001, FR-003, FR-004)
   - Colunas mínimas: título, responsável (`assignedTo`), status (balde de DEV 2), prazo,
     prioridade (derivada), ativo/área.
   - Recebe a lista **já filtrada/buscada/ordenada** (mesma derivação de DEV 3) —
     alinhar para reusar a mesma seleção do estado.
   - `useChecklistListViewModel`: lê `useChecklistData()` + `useAppState()`, aplica
     `applyFilters`/`applySearch`/`sortChecklists`/`classifyStatus` (DEV 2).

2. **Destaque de atrasados** (FR-005) — `Badge`/ícone + texto, nunca só cor. Linha
   atrasada visualmente diferenciada e somada ao contador (que DEV 3 mostra).

3. **Detalhe da ronda** (FR-007) — drawer/expansão Aura
   - Abre ao selecionar uma Checklist (`selectChecklist` → `selectedChecklistId` +
     `detailOpen`, host-synced). Lista os `ChecklistItems` (já aninhados pelo service) com
     status individual (OK / Not OK / Blocked / pendente), ativo e **medição quando
     houver** (`measurements`).
   - `useChecklistDetailViewModel`: deriva a ronda selecionada a partir do id no estado.

4. **Seleção/ordenação refletem no estado** (FR-010, FR-011) — clique em cabeçalho de
   coluna pode acionar `setSort`; linha selecionada e drawer aberto são host-synced.

> Seleção de ronda e drawer aberto/fechado são **host-synced** (FR-011): abrir o link
> compartilhado reabre o mesmo detalhe.

### Arquivos (sugestão)

```
src/features/checklist-list/use-checklist-list-view-model.ts   + .test.ts
src/features/checklist-list/checklist-table.tsx                + .test.tsx
src/features/checklist-list/checklist-row.tsx                  + .test.tsx
src/features/checklist-list/overdue-badge.tsx                  + .test.tsx
src/features/checklist-detail/use-checklist-detail-view-model.ts + .test.ts
src/features/checklist-detail/checklist-detail-drawer.tsx      + .test.tsx
src/features/checklist-detail/checklist-item-row.tsx           + .test.tsx
```

### Depende de

- **DEV 1**: `useAppState()` (seleção/sort/filtros), `useChecklistData()`.
- **DEV 2**: `classifyStatus`, `applyFilters`, `applySearch`, `sortChecklists`,
  `derivePriority`, `deriveArea`.

Codar contra mocks dos contratos enquanto DEV 1/2 finalizam.

### Testes mínimos

- ViewModel: loading/erro/vazio; linhas derivadas (status/prioridade/área) corretas;
  ordenação por prazo/status.
- Selecionar ronda abre o detalhe com os itens certos (Acceptance "Detalhe da ronda").
- Atrasado destacado com texto/ícone (Acceptance "Destaque de atrasados").
- Detalhe restaura via id no estado (Acceptance "Persistência de estado").

### Done quando

A tabela lista todas as rondas do período com atrasados destacados, e selecionar uma ronda
abre o detalhe com seus ChecklistItems (status, ativo, medição), tudo reabrindo igual após
reload/link compartilhado.

---

## 6. Contratos compartilhados (definir no DIA 1)

Estas assinaturas são o "API entre devs". DEV 1 e DEV 2 publicam; DEV 3 e DEV 4 consomem.
Mudanças aqui exigem alinhamento do time. (Tipos ilustrativos — ajustar nomes finais em
conjunto.)

### Estado host-synced — DEV 1 (FR-011)

```typescript
export type ActiveView = 'dashboard' | 'list';

export interface AppState {
  activeView: ActiveView;
  filters: Filters;                 // tipo de DEV 2
  sort: { key: SortKey; dir: SortDir };
  search: string;
  selectedChecklistId: string | null;
  detailOpen: boolean;
}

export const DEFAULT_STATE: AppState = {
  activeView: 'dashboard',
  filters: { status: [], onlyOverdue: false, priority: [], area: [], period: '30d' },
  sort: { key: 'prazo', dir: 'asc' },
  search: '',
  selectedChecklistId: null,
  detailOpen: false,
};

// Hooks expostos por DEV 1:
export function useAppState(): {
  state: AppState;
  setActiveView(v: ActiveView): void;
  setFilters(f: Filters): void;
  setSort(s: AppState['sort']): void;
  setSearch(q: string): void;
  selectChecklist(id: string): void;
  closeDetail(): void;
};

export interface ChecklistDataSource {
  checklists: Checklist[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  lastUpdatedAt: number | null;   // epoch ms da última atualização ok
  refresh(): void;
}
export function useChecklistData(): ChecklistDataSource;
```

### Domínio puro — DEV 2 (FR-002/004/006/009/010)

```typescript
export type StatusBucket = 'aberto' | 'em_andamento' | 'atrasado' | 'concluido';
export type Priority = 'alta' | 'media' | 'baixa';
export type SortKey = 'prazo' | 'status';
export type SortDir = 'asc' | 'desc';
export type Period = '7d' | '30d' | '90d' | 'all';

export interface Filters {
  status: StatusBucket[];
  onlyOverdue: boolean;
  priority: Priority[];
  area: string[];
  period: Period;
}

export interface ChecklistKpis {
  openCount: number;
  overdueCount: number;
  slaOnTimePercent: number;          // 0..100
  byStatus: Record<StatusBucket, number>;
  byPriority: Record<Priority, number>;
  byArea: { area: string; count: number }[];
}

export interface ChecklistItemKpis {
  totalItems: number;
  openItems: number;
  overdueItems: number;
  byItemStatus: Record<string, number>;
}

export function classifyStatus(c: Checklist, now: number): StatusBucket;
export function isOverdue(c: Checklist, now: number): boolean;
export function derivePriority(c: Checklist, now: number): Priority;
export function deriveArea(c: Checklist): string | null;
export function isWithinPeriod(c: Checklist, period: Period, now: number): boolean;
export function applyFilters(cs: Checklist[], f: Filters, now: number): Checklist[];
export function applySearch(cs: Checklist[], query: string): Checklist[];
export function sortChecklists(cs: Checklist[], s: { key: SortKey; dir: SortDir }, now: number): Checklist[];
export function computeChecklistKpis(cs: Checklist[], now: number): ChecklistKpis;
export function computeChecklistItemKpis(cs: Checklist[], now: number): ChecklistItemKpis;
export function computeKpis(cs: Checklist[], now: number): ChecklistKpis; // alias
export function buildChecklistView(...): { rows: Checklist[]; checklistKpis: ChecklistKpis; itemKpis: ChecklistItemKpis };
```

> **Prazo:** `endTime` da ronda; ainda no prazo no instante exato de `endTime`; **atrasado**
> após o último ms do dia civil em `America/Sao_Paulo` (`parseDeadlineEndOfDay` /
> `isPastDeadline` em `src/domain/deadline.ts`).
>
> `now` é **injetado** em todas as funções de domínio (testabilidade + auto-refresh
> determinístico, [CLAUDE.md §3](../CLAUDE.md)). KPIs de ronda e de item são calculados
> sobre a lista **já filtrada/buscada**; use `buildChecklistView` para alinhar lista e KPIs.

---

## 7. Sequenciamento e integração

```
Dia 1     ── Time fecha os CONTRATOS do §6 (30–60 min, todos juntos).
              DEV 1 e DEV 2 começam a implementar.
              DEV 3 e DEV 4 começam pelos TESTES contra mocks dos contratos.

Marco A   ── DEV 1 entrega Provider+estado+hook de dados (mesmo que com dados mock).
              DEV 2 entrega status+filtros+KPIs com testes verdes.
              → DEV 3 e DEV 4 trocam mocks pelas implementações reais.

Marco B   ── Integração no shell (DEV 1): Dashboard (DEV 3) e Lista+Detalhe (DEV 4)
              renderizam dentro do App com dados reais do CDF.

Marco C   ── Polimento: estados vazio/erro, acessibilidade (atrasado com texto/ícone),
              brand theme (design.md), validação dos Acceptance Scenarios da SPEC.
```

**Regra anti-conflito.** Cada dev é dono dos seus diretórios (`src/platform/*`,
`src/domain/*`, `src/features/dashboard|filters/*`, `src/features/checklist-list|detail/*`).
O único arquivo compartilhado é [src/App.tsx](../src/App.tsx) — **propriedade da DEV 1**;
DEV 3/4 expõem componentes raiz (`<Dashboard/>`, `<ChecklistTable/>`, etc.) que a DEV 1
monta no shell.

---

## 8. Pendências da SPEC a confirmar no modelo (impacta DEV 2)

A `Checklist@v7` real **não** tem `dueDate`/`priority` nativos (ver
[src/types/apm.ts](../src/types/apm.ts)). Decisões a registrar (donas: DEV 2, com aval do time):

- **Prazo:** usar `endTime` (planejado) como prazo da ronda? Confirmar.
- **Prioridade:** sem campo nativo → **derivar** (atraso + criticidade do ativo + labels).
  Documentar a heurística.
- **Área:** vinda de `rootLocation` (AssetSummary) da Checklist; fallback para `asset` do
  item. Confirmar agrupamento "por área".
- **Meta de SLA:** alvo de "no prazo" (ex.: ≥ 90%) para SC-005 — operacional, a definir.
- **Volume/paginação:** o gateway já pagina por `nextCursor`; reavaliar se o volume exigir
  filtro server-side para manter o refresh de 30s performático.

---

## 9. Checklist de Definition of Done (todos os devs)

- [ ] Aura primeiro; sem markup/Tailwind cru onde Aura cobre ([CLAUDE.md §1](../CLAUDE.md)).
- [ ] Estado que decide o que o usuário vê está em `syncInternalState`/`initialState`, não
      em `useState` local (§2, FR-011).
- [ ] Dependências não-stateless injetadas (§3); `now`/timers/serviço injetados.
- [ ] ViewModel sem `useState` próprio; estado na store compartilhada (§5).
- [ ] Sem `any`/`as`; parâmetros tipados (§7).
- [ ] Testes test-first conforme a tabela de cobertura mínima (§6 do CLAUDE.md);
      `npm test` e `npm run lint` verdes.
- [ ] Acessibilidade: estados (atrasado/erro) com texto/ícone além de cor (design.md).
- [ ] Read-only: nenhuma escrita no CDF (FR-001).

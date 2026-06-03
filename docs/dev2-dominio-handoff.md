# Handoff DEV 2 — Camada de domínio (`src/domain`)

> Guia para **DEV 1**, **DEV 3** e **DEV 4** consumirem a lógica de produto implementada.
> Divisão geral do time: [divisao-features-devs.md](./divisao-features-devs.md) · Spec: [SPEC.md](../SPEC.md).

---

## O que está pronto

A camada **somente leitura** do CDF continua em [`src/services/group3/`](../src/services/group3/) — não alterar assinaturas sem alinhar o time.

A **semântica de produto** (status, atraso, SLA, KPIs, filtros, busca, ordenação) vive em **`src/domain/`**:

- Funções **puras** (sem React, sem SDK).
- Entrada: `Checklist[]` normalizado de [`src/types/apm.ts`](../src/types/apm.ts).
- Saída: tipos e agregações para dashboard, tabela e estado host-synced.
- **12 módulos de teste** — `npm test` cobre `src/domain/**/*.test.ts`.

**Import único recomendado:**

```typescript
import {
  buildChecklistView,
  classifyStatus,
  deriveArea,
  derivePriority,
  DEFAULT_FILTERS,
  type Filters,
  type SortKey,
  type SortDir,
  type ChecklistKpis,
  type ChecklistItemKpis,
} from '../domain';
```

(Ajuste o path relativo conforme a pasta do feature.)

---

## Regra de ouro: um recorte para lista e KPIs

Os KPIs **devem refletir os mesmos filtros e a mesma busca** que a tabela (FR-006). Não calcule KPIs sobre a lista bruta do service se a UI já aplicou filtros.

**Opção recomendada — pipeline único:**

```typescript
import { buildChecklistView } from '../domain';

const now = lastUpdatedAt ?? Date.now(); // injetar no ViewModel; não chamar Date.now() dentro de src/domain

const { rows, checklistKpis, itemKpis } = buildChecklistView(
  checklists,           // de useChecklistData()
  state.filters,        // de useAppState() — tipo Filters
  state.search,
  state.sort,
  now
);
```

Ordem interna: `applyFilters` → `applySearch` → `sortChecklists` → `computeChecklistKpis` + `computeChecklistItemKpis`.

**Opção manual** (mesma ordem, se precisar de passos intermediários):

```typescript
import { applyFilters, applySearch, sortChecklists, computeChecklistKpis, computeChecklistItemKpis } from '../domain';

const filtered = applyFilters(all, filters, now);
const searched = applySearch(filtered, search);
const rows = sortChecklists(searched, sort, now);
const checklistKpis = computeChecklistKpis(rows, now);
const itemKpis = computeChecklistItemKpis(rows, now);
```

---

## KPIs em dois níveis (acordo com DEV 3)

O dashboard deve tratar **dois blocos** (cards ou abas):

| Função | Tipo | Conteúdo |
|--------|------|----------|
| `computeChecklistKpis` | `ChecklistKpis` | Abertos, atrasados, % SLA, distribuição por status / prioridade / área (**rondas**) |
| `computeChecklistItemKpis` | `ChecklistItemKpis` | Total de tarefas, abertas, atrasadas, `byItemStatus` (**ChecklistItems**) |

Alias de transição: `computeKpis` = `computeChecklistKpis` (contrato antigo do §6).

`DEFAULT_FILTERS` em `types.ts` — use no seed de `AppState` do DEV 1:

```typescript
filters: { status: [], onlyOverdue: false, priority: [], area: [], period: '30d' }
```

---

## Tipos para estado host-synced (DEV 1)

Importar de `src/domain` (não duplicar tipos em `src/platform`):

| Tipo | Uso em `AppState` |
|------|-------------------|
| `Filters` | `state.filters` |
| `SortKey`, `SortDir` | `state.sort` |
| `Period` | `filters.period` |
| `StatusBucket`, `Priority` | valores de filtro e exibição |

`AppState` sugerido (inalterado em relação ao [§6](./divisao-features-devs.md)):

```typescript
import type { Filters, SortKey, SortDir } from '../domain';

export interface AppState {
  activeView: 'dashboard' | 'list';
  filters: Filters;
  sort: { key: SortKey; dir: SortDir };
  search: string;
  selectedChecklistId: string | null;
  detailOpen: boolean;
}
```

**`now` para o domínio:** obter no ViewModel (ex.: `lastUpdatedAt` do hook de dados ou `Date.now()` **só na camada React**), e passar como argumento em todas as chamadas de domínio.

---

## Por dev — o que importar

### DEV 1 (plataforma)

- Tipos: `Filters`, `SortKey`, `SortDir`, `Period`, `DEFAULT_FILTERS`.
- Não reimplementar classificação de status nem KPIs no `StateProvider`.
- `useChecklistData()` continua devolvendo `Checklist[]` **cru**; domínio roda nos ViewModels (DEV 3/4) ou num selector compartilhado se preferirem centralizar.

### DEV 3 (dashboard + filtros)

- `buildChecklistView` **ou** pipeline manual acima.
- `computeChecklistKpis` + `computeChecklistItemKpis` sobre o **mesmo** `rows`.
- Filtros/busca/ordenação: apenas `setFilters` / `setSearch` / `setSort` (host-synced); debounce só no input local.
- Acessibilidade: contador de atrasados com **texto/ícone**, não só cor (usa `checklistKpis.overdueCount` + `classifyStatus` na lista).

### DEV 4 (tabela + drawer)

- `rows` do pipeline (ou o mesmo recorte que DEV 3).
- Por linha: `classifyStatus(c, now)`, `derivePriority(c, now)`, `deriveArea(c)`.
- Destaque atrasado: `isOverdue(c, now)` ou `classifyStatus(...) === 'atrasado'`.
- Detalhe (FR-007): itens já vêm aninhados em `Checklist.items`; status de item **cru** da view; opcional `classifyItemStatus(item, now)` para badges.

---

## Decisões de domínio (implementadas)

### Prazo e “atrasado”

- **Prazo da ronda:** `Checklist.endTime` (ISO).
- **Ainda no prazo** no instante exato de `endTime`.
- **Atrasado** quando `now` é **depois do último ms do dia civil** de `endTime` em `America/Sao_Paulo` (`src/domain/deadline.ts`).
- Ronda **concluída** nunca é `atrasado`, mesmo com `endTime` no passado.

### Status (balde de produto)

| Valor cru APM (ex.) | Balde |
|---------------------|--------|
| `To Do` | `aberto` |
| `Ongoing` | `em_andamento` |
| `Completed` / `done` / `closed` | `concluido` |
| Prazo vencido + não concluído | `atrasado` (sobrescreve o cru) |

Função: `classifyStatus(checklist, now)`.

### SLA (% no prazo)

- Só rondas **concluídas** entram no denominador.
- **No prazo:** `lastUpdatedTime` ≤ fim do dia civil de `endTime`.
- Sem concluídas → `100%` (nada a penalizar).
- Função: `slaOnTimePercent(checklists)` — também embutido em `ChecklistKpis.slaOnTimePercent`.

### Prioridade (derivada — sem campo na view)

1. `atrasado` → `alta`
2. Labels críticas (`OEC`, `critical`, …) em `checklist.labels` ou `rootLocation.labels` → `media`
3. Caso contrário → `baixa`

Função: `derivePriority(checklist, now)`.

### Área / ativo exibido

1. `rootLocation.title`
2. Senão, primeiro `items[].asset.title`
3. Senão `null`

Função: `deriveArea(checklist)`.

### Janela de período (FR-009, default `30d`)

`isWithinPeriod` / `filters.period`:

- **`all`:** tudo entra.
- **`7d` / `30d` / `90d`:** rondas **não concluídas** sempre entram; concluídas só se `startTime` (ou `createdTime`) estiver dentro da janela.

---

## API pública (barrel `src/domain/index.ts`)

| Export | Descrição |
|--------|-----------|
| `classifyStatus`, `isOverdue`, `isConcluded` | Status de ronda |
| `derivePriority`, `deriveArea` | Colunas derivadas |
| `applyFilters`, `isWithinPeriod` | Filtros combináveis + período |
| `applySearch` | Busca título / área / ativo / responsáveis |
| `sortChecklists` | Ordenação por `prazo` ou `status` |
| `computeChecklistKpis`, `computeChecklistItemKpis`, `computeKpis` | KPIs |
| `slaOnTimePercent` | SLA isolado (testes / uso avançado) |
| `buildChecklistView` | Pipeline lista + KPIs |
| `classifyItemStatus`, `isItemOpen`, `isItemOverdue` | Tarefas no detalhe / KPI item |
| `parseDeadlineEndOfDay`, `isPastDeadline`, `PLANT_TIME_ZONE` | Prazo (debug/testes) |
| Tipos + `DEFAULT_FILTERS` | Contratos §6 |

---

## Testes e fixtures

- Rodar: `npm test` (inclui `src/domain`).
- Fixtures de domínio: [`src/domain/__fixtures__/checklists.ts`](../src/domain/__fixtures__/checklists.ts) — grafo group3 mapeado, determinístico.
- Para mocks em ViewModels (DEV 3/4): importar tipos de `domain` e listas `Checklist[]` do fixture ou de factories locais.

---

## Anti-padrões

- Não classificar status nem calcular KPIs dentro de componentes — use ViewModel + `domain`.
- Não duplicar `Filters` / `StatusBucket` em outro pacote.
- Não chamar `Date.now()` dentro de `src/domain` (já respeitado; manter ao adicionar funções).
- Não usar `any` / `as` nas integrações (ver [CLAUDE.md](../CLAUDE.md) §7).

---

## Dúvidas / mudanças de contrato

Qualquer alteração em assinaturas de `src/domain/index.ts` ou em `Filters` / KPIs exige alinhamento nos quatro devs e atualização do [§6 em divisao-features-devs.md](./divisao-features-devs.md).

Pendências de produto ainda abertas na SPEC (turno, meta SLA %, volume/paginação server-side) **não** bloqueiam o consumo atual do domínio; registrar decisões novas neste arquivo ou na SPEC.

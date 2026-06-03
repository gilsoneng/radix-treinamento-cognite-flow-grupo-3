# DEV 1 → Outros Devs — Handoff da Plataforma

> O que a DEV 1 entregou e **como consumir** para tocar as próximas etapas. Leia antes de
> começar DEV 2 / DEV 3 / DEV 4. Tudo abaixo já está implementado, testado (34 testes novos)
> e lint/type-check limpos.

---

## 1. O que ficou pronto (mapa de arquivos)

Tudo vive em [src/platform/](../src/platform/) (a "plataforma") + os contratos de domínio em
[src/domain/types.ts](../src/domain/types.ts). **A API pública está no barrel
[src/platform/index.ts](../src/platform/index.ts) — importe sempre de lá**, nunca dos caminhos internos.

| Área | Arquivo | O que faz |
| --- | --- | --- |
| Host | [host/host-app-api-provider.tsx](../src/platform/host/host-app-api-provider.tsx) | Conecta ao Fusion e provê `{ api, initialState }` |
| Host | [host/use-host-app-api.ts](../src/platform/host/use-host-app-api.ts) | `useHostAppApi()` |
| Estado | [state/app-state.ts](../src/platform/state/app-state.ts) | Tipo `AppState`, `DEFAULT_STATE`, `parseAppState`, `serializeAppState` |
| Estado | [state/app-state-provider.tsx](../src/platform/state/app-state-provider.tsx) | Store única host-synced (seed + sync) |
| Estado | [state/use-app-state.ts](../src/platform/state/use-app-state.ts) | `useAppState()` (getter + setters) |
| Dados | [data/use-checklist-data.ts](../src/platform/data/use-checklist-data.ts) | `useChecklistData()` (auto-refresh ~30s) |
| Dados | [data/checklist-data-context.ts](../src/platform/data/checklist-data-context.ts) | DI do service + constantes |
| Shell | [shell/app-shell.tsx](../src/platform/shell/app-shell.tsx) | Layout raiz onde DEV 3/DEV 4 plugam |
| Shell | [shell/feature-slot.tsx](../src/platform/shell/feature-slot.tsx) | **Placeholders a substituir** por Dashboard/Lista |
| Contratos | [domain/types.ts](../src/domain/types.ts) | `StatusBucket`, `Priority`, `Filters`, `Sort`, `Kpis`, ... |

Composição em [src/App.tsx](../src/App.tsx):
`CogniteSdkProvider → HostAppApiProvider → AppStateProvider → AppShell`
(o `QueryClientProvider` vem do [src/main.tsx](../src/main.tsx)).

---

## 2. DEV 3 e DEV 4 — como ler estado e dados

Tudo o que você precisa sai de **dois hooks**. Não use `useState` para o que decide o que o
usuário vê — use os setters do `useAppState` (CLAUDE.md §2/§11; isso é o que faz reload e link
compartilhado funcionarem).

```tsx
import { useAppState, useChecklistData } from '../platform';

function MinhaFeature() {
  const { state, setFilters, setSort, setSearch, selectChecklist, closeDetail, setActiveView } = useAppState();
  const { checklists, isLoading, isRefreshing, isError, error, lastUpdatedAt, refresh } = useChecklistData();
  // ...renderize a partir de `state` (host-synced) + `checklists` (dados do CDF)
}
```

### `useAppState()` expõe

| Campo / método | Tipo | Para quê |
| --- | --- | --- |
| `state.activeView` | `'dashboard' \| 'list'` | Visão ativa (o shell já alterna) |
| `state.filters` | `Filters` | Filtros aplicados (status, onlyOverdue, priority, area, period) |
| `state.sort` | `{ key: 'prazo' \| 'status'; dir: 'asc' \| 'desc' }` | Ordenação |
| `state.search` | `string` | Texto de busca aplicado |
| `state.selectedChecklistId` | `string \| null` | Ronda selecionada |
| `state.detailOpen` | `boolean` | Drawer de detalhe aberto? |
| `setActiveView(v)` | | Troca a visão |
| `setFilters(f)` | | Aplica filtros (DEV 3) |
| `setSort(s)` | | Aplica ordenação (DEV 3/4) |
| `setSearch(q)` | | Aplica busca (DEV 3) |
| `selectChecklist(id)` | | Seleciona a ronda **e abre o detalhe** (DEV 4) |
| `closeDetail()` | | Fecha o detalhe (mantém a seleção) |

> Cada setter já **persiste no host** automaticamente — você não chama `syncInternalState`.
> Input "em digitação" antes de aplicar pode ser `useState` local; o valor **aplicado** vai
> para `setSearch`.

### `useChecklistData()` expõe (`ChecklistDataSource`)

| Campo | Tipo | Observação |
| --- | --- | --- |
| `checklists` | `Checklist[]` | Domínio normalizado (itens + medições aninhados) — ver [types/apm.ts](../src/types/apm.ts) |
| `isLoading` | `boolean` | `true` só na **primeira** carga |
| `isRefreshing` | `boolean` | `true` durante o polling/refresh de fundo (use p/ spinner discreto) |
| `isError` / `error` | `boolean` / `unknown` | Estado de erro |
| `lastUpdatedAt` | `number \| null` | Epoch ms da última atualização ok |
| `refresh()` | `() => void` | Refetch manual |

A lista vem **completa** (sem filtro). **Filtrar/ordenar/buscar é papel da DEV 2 (funções) +
DEV 3/4 (aplicar)** sobre `state.filters/sort/search`.

---

## 3. DEV 3 / DEV 4 — onde plugar suas telas

O shell renderiza placeholders em [shell/feature-slot.tsx](../src/platform/shell/feature-slot.tsx)
e os escolhe por `activeView` em [shell/shell-content.tsx](../src/platform/shell/shell-content.tsx).

**Para integrar:** entreguem componentes raiz (ex.: `<Dashboard/>`, `<ChecklistTable/>`,
`<ChecklistDetailDrawer/>`) e troquem `DashboardSlot`/`ChecklistListSlot` por eles em
`shell-content.tsx`. O resto da plataforma **não muda** (princípio Open/Closed). Os estados
**carregando / erro / vazio** já são tratados pelo shell — sua tela só precisa do caminho feliz.

---

## 4. DEV 2 — contrato que você implementa

Os **tipos** já estão em [src/domain/types.ts](../src/domain/types.ts) (acordo do Dia 1).
Falta você implementar as **funções puras** em `src/domain/*.ts` com estas assinaturas
(todas recebem `now: number` injetado — nada de `Date.now()` direto):

```ts
classifyStatus(c: Checklist, now: number): StatusBucket
isOverdue(c: Checklist, now: number): boolean
derivePriority(c: Checklist): Priority
deriveArea(c: Checklist): string | null
isWithinPeriod(c: Checklist, period: Period, now: number): boolean
applyFilters(cs: Checklist[], f: Filters, now: number): Checklist[]
applySearch(cs: Checklist[], query: string): Checklist[]
sortChecklists(cs: Checklist[], s: Sort, now: number): Checklist[]
computeKpis(cs: Checklist[], now: number): Kpis
```

Decisões pendentes a registrar (já mapeadas em [divisao-features-devs.md](divisao-features-devs.md) §8):
prazo = `endTime`? prioridade derivada (sem campo nativo); área via `rootLocation`; meta de SLA.

> **Importante p/ DEV 3/4:** ao usar `now` nas funções da DEV 2, peguem o horário **uma vez**
> por render (ex.: `const now = Date.now()` no topo do ViewModel) e passem adiante — assim o
> resultado é estável e os testes ficam determinísticos.

---

## 5. Contratos que NÃO se muda sozinho

Mudar qualquer um destes quebra outras frentes — alinhe com o time antes:

- `AppState` e os tipos em `domain/types.ts` (a "linguagem comum").
- A forma de `ChecklistDataSource` (o que `useChecklistData` devolve).
- As assinaturas dos setters de `useAppState`.

---

## 6. Padrões a seguir (herdados do CLAUDE.md)

- **Aura primeiro**; quando a Aura não cobrir, HTML/React padrão estilizado com **tokens da
  marca** (`bg-card`, `text-muted-foreground`, `border`, ...) — nunca hex cru. Base em
  [specs/design.md](../specs/design.md).
- **ViewModel** faz a lógica; **componentes só renderizam**. ViewModel **não** tem `useState`
  próprio (o estado mora na store da plataforma).
- **DI por contexto**: dependa de hooks/contratos, não importe SDK/serviço direto.
- **Test-first**, sem `any`/`as` (exceção: `Partial<T> as T` só em mock de teste).
- Imports **relativos** (não há alias `@/` no Vitest).

---

## 7. Como rodar

```bash
npm test          # 63 testes (29 antigos + 34 da plataforma)
npx tsc --noEmit  # type-check (limpo)
npm run lint      # seu código deve ficar limpo; há 4 erros PRÉ-EXISTENTES em scripts/*.mjs (fora do nosso escopo)
npm run dev       # sobe o app (Vite)
```

Fábricas de mock reutilizáveis já disponíveis em [src/__mocks__/](../src/__mocks__/):
`makeChecklist()` e `makeHostAppApi()`.

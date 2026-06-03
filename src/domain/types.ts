/**
 * Contratos COMPARTILHADOS de domínio (acordo do "Dia 1" — ver
 * `docs/divisao-features-devs.md` §6). São apenas TIPOS + constantes de validação:
 * a semântica (classificar status, calcular KPIs, filtrar, ordenar) é implementada
 * pela DEV 2 em `src/domain/*.ts` contra estas assinaturas.
 *
 * Ficam aqui (e não em `useState` de ninguém) porque tanto o estado host-synced da
 * DEV 1 (`AppState` referencia `Filters`/`SortKey`/`SortDir`) quanto os ViewModels da
 * DEV 3/DEV 4 dependem do MESMO vocabulário. Mudar algo aqui exige alinhar o time.
 */

/** Balde de status de uma ronda (FR-004). "atrasado" = prazo vencido E não concluído. */
export type StatusBucket = 'aberto' | 'em_andamento' | 'atrasado' | 'concluido';

/** Prioridade da ronda — DERIVADA (a `Checklist@v7` não tem campo nativo). */
export type Priority = 'alta' | 'media' | 'baixa';

/** Chave de ordenação da lista (FR-010 exige no mínimo prazo e status). */
export type SortKey = 'prazo' | 'status';

/** Direção de ordenação. */
export type SortDir = 'asc' | 'desc';

/** Janela de período (FR-009: padrão = abertos + últimos 30 dias). */
export type Period = '7d' | '30d' | '90d' | 'all';

/** Filtros combináveis aplicados à lista e refletidos nos KPIs (FR-006). */
export interface Filters {
  status: StatusBucket[];
  onlyOverdue: boolean;
  priority: Priority[];
  area: string[];
  period: Period;
}

/** Configuração de ordenação host-synced. */
export interface Sort {
  key: SortKey;
  dir: SortDir;
}

/** Indicadores de rondas (checklists) do topo do dashboard (FR-002). */
export interface ChecklistKpis {
  openCount: number;
  overdueCount: number;
  /** 0..100 — % concluído no prazo (SLA). */
  slaOnTimePercent: number;
  byStatus: Record<StatusBucket, number>;
  byPriority: Record<Priority, number>;
  byArea: { area: string; count: number }[];
}

/** Indicadores agregados dos ITENS dentro das rondas. */
export interface ChecklistItemKpis {
  totalItems: number;
  openItems: number;
  overdueItems: number;
  byItemStatus: Record<string, number>;
}

// --- Conjuntos válidos (usados para validar estado vindo de links compartilhados) ---

export const STATUS_BUCKETS: readonly StatusBucket[] = ['aberto', 'em_andamento', 'atrasado', 'concluido'];
export const PRIORITIES: readonly Priority[] = ['alta', 'media', 'baixa'];
export const SORT_KEYS: readonly SortKey[] = ['prazo', 'status'];
export const SORT_DIRS: readonly SortDir[] = ['asc', 'desc'];
export const PERIODS: readonly Period[] = ['7d', '30d', '90d', 'all'];

/** Filtros vazios (nenhum recorte) com a janela padrão de 30 dias (FR-009). */
export const EMPTY_FILTERS: Filters = {
  status: [],
  onlyOverdue: false,
  priority: [],
  area: [],
  period: '30d',
};

/** Alias de `EMPTY_FILTERS` usado pela camada de domínio (DEV 2) e seus testes. */
export const DEFAULT_FILTERS: Filters = EMPTY_FILTERS;

export const EMPTY_STATUS_BUCKETS: Record<StatusBucket, number> = {
  aberto: 0,
  em_andamento: 0,
  atrasado: 0,
  concluido: 0,
};

export const EMPTY_PRIORITY_BUCKETS: Record<Priority, number> = {
  alta: 0,
  media: 0,
  baixa: 0,
};

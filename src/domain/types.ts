/**
 * Contratos públicos da camada de domínio (DEV 2).
 * Consumidos por DEV 1 (AppState), DEV 3 (dashboard) e DEV 4 (lista/detalhe).
 */

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

export const DEFAULT_FILTERS: Filters = {
  status: [],
  onlyOverdue: false,
  priority: [],
  area: [],
  period: '30d',
};

export interface ChecklistKpis {
  openCount: number;
  overdueCount: number;
  slaOnTimePercent: number;
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

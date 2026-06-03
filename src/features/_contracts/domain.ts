/**
 * TODO(DEV2): Replace this stub with `src/domain` when DEV 2 lands.
 * Temporary contract types + throw-only stubs for DEV 3 DI defaults.
 * Signatures match docs/divisao-features-devs.md §6.
 */

import type { Checklist } from '../../types/apm';

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

export interface Kpis {
  openCount: number;
  overdueCount: number;
  slaOnTimePercent: number;
  byStatus: Record<StatusBucket, number>;
  byPriority: Record<Priority, number>;
  byArea: { area: string; count: number }[];
}

const STUB_MSG = 'TODO(DEV2): implement domain module';

export function applyFilters(_cs: Checklist[], _f: Filters, _now: number): Checklist[] {
  throw new Error(STUB_MSG);
}

export function applySearch(_cs: Checklist[], _query: string): Checklist[] {
  throw new Error(STUB_MSG);
}

export function computeKpis(_cs: Checklist[], _now: number): Kpis {
  throw new Error(STUB_MSG);
}

export function sortChecklists(
  _cs: Checklist[],
  _s: { key: SortKey; dir: SortDir },
  _now: number
): Checklist[] {
  throw new Error(STUB_MSG);
}

/**
 * TODO(DEV1): Replace this stub with `src/platform` when DEV 1 lands.
 * Temporary contract types + throw-only stubs for DEV 3 DI defaults.
 * Signatures match docs/divisao-features-devs.md §6.
 */

import type { Checklist } from '../../types/apm';

import type { Filters, SortDir, SortKey } from './domain';

export type ActiveView = 'dashboard' | 'list';

export interface AppState {
  activeView: ActiveView;
  filters: Filters;
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

export interface ChecklistDataSource {
  checklists: Checklist[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  lastUpdatedAt: number | null;
  refresh(): void;
}

export interface AppStateActions {
  state: AppState;
  setActiveView(v: ActiveView): void;
  setFilters(f: Filters): void;
  setSort(s: AppState['sort']): void;
  setSearch(q: string): void;
  selectChecklist(id: string): void;
  closeDetail(): void;
}

const STUB_MSG = 'TODO(DEV1): implement platform module';

export function useAppState(): AppStateActions {
  throw new Error(STUB_MSG);
}

export function useChecklistData(): ChecklistDataSource {
  throw new Error(STUB_MSG);
}

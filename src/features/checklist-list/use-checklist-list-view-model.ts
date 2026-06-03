/**
 * ViewModel da lista/tabela de Checklists (DEV 4, FR-001/003/004/010).
 *
 * Compõe os contratos reais de DEV 1 (`useChecklistData`, `useAppState`) com o pipeline
 * de DEV 2 (`buildChecklistView`). É stateless (CLAUDE.md §5): apenas deriva linhas e expõe comandos
 * que escrevem no estado host-synced via setters do `useAppState`.
 */

import { useMemo } from 'react';

import type { Priority, SortKey, SortState, StatusBucket } from '../contracts';
import { useFeatureDeps } from '../feature-deps';

import type { Checklist } from '../../types/apm';

export interface ChecklistRowVM {
  id: string;
  title: string;
  /** Responsáveis unidos por vírgula (`assignedTo`), ou string vazia se nenhum. */
  assignedTo: string;
  status: StatusBucket;
  isOverdue: boolean;
  /** Prazo planejado (`endTime`, ISO) — a view não tem `dueDate` nativo. */
  endTime: string | null;
  priority: Priority;
  /** Área derivada (`rootLocation`/`asset`), ou `null` quando indeterminada. */
  area: string | null;
  raw: Checklist;
}

export interface ChecklistListViewModel {
  rows: ChecklistRowVM[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  sort: SortState;
  selectedId: string | null;
  toggleSort(key: SortKey): void;
  selectRow(id: string): void;
}

export function useChecklistListViewModel(): ChecklistListViewModel {
  const { useChecklistData, useAppState, buildChecklistView, classifyStatus, isOverdue, derivePriority, deriveArea, now } =
    useFeatureDeps();

  const { checklists, isLoading, isError, lastUpdatedAt } = useChecklistData();
  const { state, setSort, selectChecklist } = useAppState();
  const { filters, sort, search, selectedChecklistId } = state;

  const rows = useMemo<ChecklistRowVM[]>(() => {
    if (isLoading || isError) return [];
    const at = lastUpdatedAt ?? now();
    const view = buildChecklistView(checklists, filters, search, sort, at);
    return view.rows.map((checklist) => toRow(checklist, at, { classifyStatus, isOverdue, derivePriority, deriveArea }));
  }, [
    checklists,
    isLoading,
    isError,
    lastUpdatedAt,
    filters,
    search,
    sort,
    now,
    buildChecklistView,
    classifyStatus,
    isOverdue,
    derivePriority,
    deriveArea,
  ]);

  const isEmpty = !isLoading && !isError && rows.length === 0;

  const toggleSort = (key: SortKey): void => {
    const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : sort.key === key ? 'asc' : 'asc';
    setSort({ key, dir });
  };

  return {
    rows,
    isLoading,
    isError,
    isEmpty,
    sort,
    selectedId: selectedChecklistId,
    toggleSort,
    selectRow: selectChecklist,
  };
}

interface RowDeriveDeps {
  classifyStatus: (c: Checklist, now: number) => StatusBucket;
  isOverdue: (c: Checklist, now: number) => boolean;
  derivePriority: (c: Checklist, now: number) => Priority;
  deriveArea: (c: Checklist) => string | null;
}

function toRow(checklist: Checklist, at: number, deps: RowDeriveDeps): ChecklistRowVM {
  return {
    id: checklist.externalId,
    title: checklist.title ?? '(sem título)',
    assignedTo: checklist.assignedTo.join(', '),
    status: deps.classifyStatus(checklist, at),
    isOverdue: deps.isOverdue(checklist, at),
    endTime: checklist.endTime,
    priority: deps.derivePriority(checklist, at),
    area: deps.deriveArea(checklist),
    raw: checklist,
  };
}

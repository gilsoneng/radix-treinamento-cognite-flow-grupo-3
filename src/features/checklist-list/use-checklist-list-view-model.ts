/**
 * ViewModel da lista/tabela de rondas (FR-003/004/005/010). Aplica o MESMO recorte do
 * dashboard via `buildChecklistView` (DEV 2) e pré-deriva cada linha (status/prioridade/
 * área/prazo) para o componente só renderizar (CLAUDE.md §5). Seleção e ordenação são
 * host-synced (DEV 1).
 */

import { createContext, useContext, useMemo } from 'react';

import { buildChecklistView, classifyStatus, deriveArea, derivePriority, isOverdue } from '../../domain';
import type { Priority, Sort, SortKey, StatusBucket } from '../../domain';
import { useAppState, useChecklistData } from '../../platform';
import type { Checklist } from '../../types/apm';
import { systemClock } from '../shared/clock';
import type { Clock } from '../shared/clock';
import { formatDate } from '../shared/format-date';

const defaultDeps = { useChecklistData, useAppState, now: systemClock as Clock };
export type ChecklistListViewModelDeps = typeof defaultDeps;
export const ChecklistListViewModelContext = createContext<ChecklistListViewModelDeps>(defaultDeps);

export interface ChecklistRowView {
  externalId: string;
  title: string;
  assignedToLabel: string;
  statusBucket: StatusBucket;
  priority: Priority;
  area: string;
  deadlineLabel: string;
  isOverdue: boolean;
  isSelected: boolean;
}

export interface ChecklistListViewModel {
  rows: ChecklistRowView[];
  sort: Sort;
  /** Clique no cabeçalho: mesma coluna inverte a direção; coluna nova começa em asc. */
  toggleSort(key: SortKey): void;
  selectChecklist(id: string): void;
  isLoading: boolean;
  isError: boolean;
}

function toRow(checklist: Checklist, now: number, selectedId: string | null): ChecklistRowView {
  return {
    externalId: checklist.externalId,
    title: checklist.title ?? '(sem título)',
    assignedToLabel: checklist.assignedTo.length > 0 ? checklist.assignedTo.join(', ') : '—',
    statusBucket: classifyStatus(checklist, now),
    priority: derivePriority(checklist, now),
    area: deriveArea(checklist) ?? '—',
    deadlineLabel: formatDate(checklist.endTime),
    isOverdue: isOverdue(checklist, now),
    isSelected: checklist.externalId === selectedId,
  };
}

export function useChecklistListViewModel(): ChecklistListViewModel {
  const { useChecklistData, useAppState, now } = useContext(ChecklistListViewModelContext);
  const { checklists, isLoading, isError } = useChecklistData();
  const { state, setSort, selectChecklist } = useAppState();

  const rows = useMemo(() => {
    const instant = now();
    const { rows: sortedChecklists } = buildChecklistView(checklists, state.filters, state.search, state.sort, instant);
    return sortedChecklists.map((checklist) => toRow(checklist, instant, state.selectedChecklistId));
  }, [checklists, state.filters, state.search, state.sort, state.selectedChecklistId, now]);

  return {
    rows,
    sort: state.sort,
    toggleSort: (key) =>
      setSort({ key, dir: state.sort.key === key && state.sort.dir === 'asc' ? 'desc' : 'asc' }),
    selectChecklist,
    isLoading,
    isError,
  };
}

/**
 * ViewModel dos controles de recorte (filtros + busca + ordenação) — FR-006/010/014.
 *
 * Toda a lógica vive aqui; o `FiltersBar` só renderiza (CLAUDE.md §5). O estado é
 * host-synced: cada setter delega aos setters do `useAppState` (DEV 1), nunca a `useState`
 * local. As dependências (hooks + relógio) chegam por contexto (DI, §3) para os testes.
 */

import { createContext, useContext, useMemo } from 'react';

import { deriveArea } from '../../domain';
import type { Filters, Period, Priority, Sort, StatusBucket } from '../../domain';
import { useAppState, useChecklistData } from '../../platform';
import { systemClock } from '../shared/clock';
import type { Clock } from '../shared/clock';

const defaultDeps = { useChecklistData, useAppState, now: systemClock as Clock };
export type FiltersViewModelDeps = typeof defaultDeps;
export const FiltersViewModelContext = createContext<FiltersViewModelDeps>(defaultDeps);

export interface FiltersViewModel {
  filters: Filters;
  search: string;
  sort: Sort;
  /** Áreas distintas presentes nos dados (para o seletor de área). */
  availableAreas: string[];
  /** Quantos recortes estão ativos (para badge "limpar filtros"). */
  activeFilterCount: number;
  toggleStatus(bucket: StatusBucket): void;
  togglePriority(priority: Priority): void;
  toggleOnlyOverdue(): void;
  setPeriod(period: Period): void;
  /** `null` = todas as áreas. */
  setArea(area: string | null): void;
  setSearch(query: string): void;
  setSort(sort: Sort): void;
  clearFilters(): void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function countActive(filters: Filters): number {
  return (
    filters.status.length +
    filters.priority.length +
    filters.area.length +
    (filters.onlyOverdue ? 1 : 0) +
    (filters.period !== '30d' ? 1 : 0)
  );
}

export function useFiltersViewModel(): FiltersViewModel {
  const { useChecklistData, useAppState, now } = useContext(FiltersViewModelContext);
  const { checklists } = useChecklistData();
  const { state, setFilters, setSearch, setSort } = useAppState();
  const { filters, search, sort } = state;

  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    for (const checklist of checklists) {
      const area = deriveArea(checklist);
      if (area !== null) set.add(area);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
  }, [checklists]);

  return useMemo<FiltersViewModel>(() => {
    void now; // relógio reservado p/ futuras derivações dependentes de tempo
    return {
      filters,
      search,
      sort,
      availableAreas,
      activeFilterCount: countActive(filters),
      toggleStatus: (bucket) => setFilters({ ...filters, status: toggle(filters.status, bucket) }),
      togglePriority: (priority) => setFilters({ ...filters, priority: toggle(filters.priority, priority) }),
      toggleOnlyOverdue: () => setFilters({ ...filters, onlyOverdue: !filters.onlyOverdue }),
      setPeriod: (period) => setFilters({ ...filters, period }),
      setArea: (area) => setFilters({ ...filters, area: area === null ? [] : [area] }),
      setSearch,
      setSort,
      clearFilters: () => setFilters({ status: [], onlyOverdue: false, priority: [], area: [], period: '30d' }),
    };
  }, [filters, search, sort, availableAreas, setFilters, setSearch, setSort, now]);
}

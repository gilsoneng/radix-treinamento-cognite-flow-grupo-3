import { createContext, useCallback, useContext, useMemo } from 'react';

import { deriveArea } from '../../domain';
import type { Filters, Period, Priority, SortDir, SortKey, StatusBucket } from '../../domain';
import { useAppState, useChecklistData } from '../../platform';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export interface FiltersViewModel {
  filters: Filters;
  sort: { key: SortKey; dir: SortDir };
  search: string;
  availableAreas: string[];
  statusOptions: FilterOption<StatusBucket>[];
  priorityOptions: FilterOption<Priority>[];
  periodOptions: FilterOption<Period>[];
  setFilters(f: Filters): void;
  setSort(s: { key: SortKey; dir: SortDir }): void;
  setSearch(q: string): void;
  toggleStatusFilter(status: StatusBucket): void;
  togglePriorityFilter(priority: Priority): void;
  toggleAreaFilter(area: string): void;
  toggleOnlyOverdue(): void;
  setPeriod(period: Period): void;
}

export type FiltersViewModelContextType = {
  useAppState: typeof useAppState;
  useChecklistData: typeof useChecklistData;
  deriveArea: typeof deriveArea;
};

const STATUS_OPTIONS: FilterOption<StatusBucket>[] = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'concluido', label: 'Concluído' },
];

const PRIORITY_OPTIONS: FilterOption<Priority>[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
];

const PERIOD_OPTIONS: FilterOption<Period>[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todos' },
];

const defaultDeps: FiltersViewModelContextType = {
  useAppState,
  useChecklistData,
  deriveArea,
};

export const FiltersViewModelContext = createContext<FiltersViewModelContextType>(defaultDeps);

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function useFiltersViewModel(): FiltersViewModel {
  const { useAppState: useState, useChecklistData: useData, deriveArea: resolveArea } =
    useContext(FiltersViewModelContext);
  const { state, setFilters: setFiltersHost, setSort: setSortHost, setSearch: setSearchHost } = useState();
  const { checklists } = useData();

  const availableAreas = useMemo(() => {
    const areas = new Set<string>();
    for (const c of checklists) {
      const area = resolveArea(c);
      if (area !== null && area.length > 0) {
        areas.add(area);
      }
    }
    return [...areas].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [checklists, resolveArea]);

  const setFilters = useCallback((f: Filters) => setFiltersHost(f), [setFiltersHost]);

  const toggleStatusFilter = useCallback(
    (status: StatusBucket) => {
      setFiltersHost({
        ...state.filters,
        status: toggleInList(state.filters.status, status),
      });
    },
    [state.filters, setFiltersHost]
  );

  const togglePriorityFilter = useCallback(
    (priority: Priority) => {
      setFiltersHost({
        ...state.filters,
        priority: toggleInList(state.filters.priority, priority),
      });
    },
    [state.filters, setFiltersHost]
  );

  const toggleAreaFilter = useCallback(
    (area: string) => {
      setFiltersHost({
        ...state.filters,
        area: toggleInList(state.filters.area, area),
      });
    },
    [state.filters, setFiltersHost]
  );

  const toggleOnlyOverdue = useCallback(() => {
    setFiltersHost({
      ...state.filters,
      onlyOverdue: !state.filters.onlyOverdue,
    });
  }, [state.filters, setFiltersHost]);

  const setPeriod = useCallback(
    (period: Period) => {
      setFiltersHost({ ...state.filters, period });
    },
    [state.filters, setFiltersHost]
  );

  return {
    filters: state.filters,
    sort: state.sort,
    search: state.search,
    availableAreas,
    statusOptions: STATUS_OPTIONS,
    priorityOptions: PRIORITY_OPTIONS,
    periodOptions: PERIOD_OPTIONS,
    setFilters,
    setSort: setSortHost,
    setSearch: setSearchHost,
    toggleStatusFilter,
    togglePriorityFilter,
    toggleAreaFilter,
    toggleOnlyOverdue,
    setPeriod,
  };
}

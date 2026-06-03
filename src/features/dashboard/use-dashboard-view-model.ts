import { createContext, useContext, useMemo } from 'react';

import {
  applyFilters,
  applySearch,
  computeKpis,
  useAppState,
  useChecklistData,
  type Kpis,
} from '../_contracts';

export interface DashboardViewModel {
  isLoading: boolean;
  isError: boolean;
  kpis: Kpis | null;
  lastUpdatedAt: number | null;
  refresh(): void;
}

export type DashboardViewModelContextType = {
  useChecklistData: typeof useChecklistData;
  useAppState: typeof useAppState;
  applyFilters: typeof applyFilters;
  applySearch: typeof applySearch;
  computeKpis: typeof computeKpis;
  getNow: () => number;
};

const defaultDeps: DashboardViewModelContextType = {
  useChecklistData,
  useAppState,
  applyFilters,
  applySearch,
  computeKpis,
  getNow: () => Date.now(),
};

export const DashboardViewModelContext = createContext<DashboardViewModelContextType>(defaultDeps);

export function useDashboardViewModel(): DashboardViewModel {
  const { useChecklistData: useData, useAppState: useState, applyFilters: filter, applySearch: search, computeKpis: kpis, getNow } =
    useContext(DashboardViewModelContext);

  const { checklists, isLoading, isError, lastUpdatedAt, refresh } = useData();
  const { state } = useState();
  const now = getNow();

  const derivedKpis = useMemo((): Kpis | null => {
    if (isLoading || isError) {
      return null;
    }
    const filtered = filter(checklists, state.filters, now);
    const searched = search(filtered, state.search);
    return kpis(searched, now);
  }, [checklists, state.filters, state.search, isLoading, isError, now, filter, search, kpis]);

  return {
    isLoading,
    isError,
    kpis: derivedKpis,
    lastUpdatedAt,
    refresh,
  };
}

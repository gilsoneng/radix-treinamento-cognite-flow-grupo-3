import { createContext, useContext, useMemo } from 'react';

import { buildChecklistView, type ChecklistItemKpis, type ChecklistKpis } from '../../domain';
import { useAppState, useChecklistData } from '../../platform';

export interface DashboardViewModel {
  isLoading: boolean;
  isError: boolean;
  checklistKpis: ChecklistKpis | null;
  itemKpis: ChecklistItemKpis | null;
  lastUpdatedAt: number | null;
  refresh(): void;
}

export type DashboardViewModelContextType = {
  useChecklistData: typeof useChecklistData;
  useAppState: typeof useAppState;
  buildChecklistView: typeof buildChecklistView;
  getNow: () => number;
};

const defaultDeps: DashboardViewModelContextType = {
  useChecklistData,
  useAppState,
  buildChecklistView,
  getNow: () => Date.now(),
};

export const DashboardViewModelContext = createContext<DashboardViewModelContextType>(defaultDeps);

export function useDashboardViewModel(): DashboardViewModel {
  const { useChecklistData: useData, useAppState: useState, buildChecklistView: buildView, getNow } =
    useContext(DashboardViewModelContext);

  const { checklists, isLoading, isError, lastUpdatedAt, refresh } = useData();
  const { state } = useState();
  const now = lastUpdatedAt ?? getNow();

  const view = useMemo(() => {
    if (isLoading || isError) {
      return null;
    }
    return buildView(checklists, state.filters, state.search, state.sort, now);
  }, [checklists, state.filters, state.search, state.sort, isLoading, isError, now, buildView]);

  return {
    isLoading,
    isError,
    checklistKpis: view?.checklistKpis ?? null,
    itemKpis: view?.itemKpis ?? null,
    lastUpdatedAt,
    refresh,
  };
}

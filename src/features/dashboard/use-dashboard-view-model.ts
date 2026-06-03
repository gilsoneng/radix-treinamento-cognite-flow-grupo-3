/**
 * ViewModel do dashboard de KPIs (FR-002). Compõe os dados (DEV 1) + o estado host-synced
 * (filtros/busca/ordenação) + o motor de domínio (DEV 2) via `buildChecklistView`, garantindo
 * que os KPIs reflitam exatamente o mesmo recorte da lista (FR-006). Só deriva; não tem estado.
 */

import { createContext, useContext, useMemo } from 'react';

import { buildChecklistView } from '../../domain';
import type { ChecklistItemKpis, ChecklistKpis } from '../../domain';
import { useAppState, useChecklistData } from '../../platform';
import { systemClock } from '../shared/clock';
import type { Clock } from '../shared/clock';

const defaultDeps = { useChecklistData, useAppState, now: systemClock as Clock };
export type DashboardViewModelDeps = typeof defaultDeps;
export const DashboardViewModelContext = createContext<DashboardViewModelDeps>(defaultDeps);

export interface DashboardViewModel {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  checklistKpis: ChecklistKpis;
  itemKpis: ChecklistItemKpis;
  /** Nº de rondas após o recorte atual (0 = filtros não casaram). */
  rowCount: number;
}

export function useDashboardViewModel(): DashboardViewModel {
  const { useChecklistData, useAppState, now } = useContext(DashboardViewModelContext);
  const { checklists, isLoading, isError, error } = useChecklistData();
  const { state } = useAppState();

  const view = useMemo(
    () => buildChecklistView(checklists, state.filters, state.search, state.sort, now()),
    [checklists, state.filters, state.search, state.sort, now]
  );

  return {
    isLoading,
    isError,
    error,
    checklistKpis: view.checklistKpis,
    itemKpis: view.itemKpis,
    rowCount: view.rows.length,
  };
}

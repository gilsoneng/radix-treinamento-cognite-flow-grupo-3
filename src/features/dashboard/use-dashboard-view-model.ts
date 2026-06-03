/**
 * ViewModel do dashboard de gráficos OK/Not Ok
 * (spec `specs/feature-graficos-ok-notok-drilldown.md`).
 *
 * Stateless (CLAUDE.md §5): compõe `useChecklistData` + `useAppState` (DEV 1) com o
 * orquestrador puro `buildChartData` (domínio). A escala e a seleção do gráfico são estado
 * HOST-SYNCED — manipuladas SEMPRE via setters do `useAppState`, nunca `useState` local.
 */

import { useMemo } from 'react';

import type { ChartResult, ChartScale, ChartSelection, ChartViewResult, TimeBin } from '../../domain';
import { useFeatureDeps } from '../feature-deps';

export interface DashboardViewModel {
  isLoading: boolean;
  isError: boolean;
  /** Sem itens no recorte de filtros (a tela pode estar carregada, mas o filtro zerou). */
  isEmpty: boolean;
  chart: ChartViewResult;
  scale: ChartScale;
  selection: ChartSelection | null;
  setScale(scale: ChartScale): void;
  selectBin(bin: TimeBin, result: ChartResult): void;
  clearSelection(): void;
}

export function useDashboardViewModel(): DashboardViewModel {
  const { useChecklistData, useAppState, buildChartData, now } = useFeatureDeps();

  const { checklists, isLoading, isError, lastUpdatedAt } = useChecklistData();
  const { state, setChartScale, selectChartBin, clearChartSelection } = useAppState();
  const { filters, search, chartScale, chartSelection } = state;

  const chart = useMemo<ChartViewResult>(() => {
    const at = lastUpdatedAt ?? now();
    return buildChartData(checklists, filters, search, chartScale, chartSelection, at);
  }, [checklists, filters, search, chartScale, chartSelection, lastUpdatedAt, now, buildChartData]);

  const isEmpty = !isLoading && !isError && chart.totalFilteredItems === 0;

  const selectBin = (bin: TimeBin, result: ChartResult): void => {
    selectChartBin({ scale: chartScale, binStart: bin.start, binEnd: bin.end, result, binLabel: bin.label });
  };

  return {
    isLoading,
    isError,
    isEmpty,
    chart,
    scale: chartScale,
    selection: chartSelection,
    setScale: setChartScale,
    selectBin,
    clearSelection: clearChartSelection,
  };
}

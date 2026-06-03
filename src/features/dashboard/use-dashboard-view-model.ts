/**
 * ViewModel do dashboard: KPIs consolidados + gráficos OK/Not Ok
 * (spec `specs/feature-graficos-ok-notok-drilldown.md`).
 *
 * Stateless (CLAUDE.md §5): compõe `useChecklistData` + `useAppState` (DEV 1) com os
 * orquestradores puros do domínio — `buildChecklistView` (KPIs de ronda/itens) e
 * `buildChartData` (séries instantânea/temporal + drill-down). A escala e a seleção do
 * gráfico são estado HOST-SYNCED — manipuladas SEMPRE via setters do `useAppState`, nunca
 * `useState` local. Os KPIs respeitam os filtros vigentes e a seleção de gráfico
 * (cross-filter, FR-008), reaproveitando `filterChecklistsByChartSelection`.
 */

import { useMemo } from 'react';

import type {
  ChartResult,
  ChartScale,
  ChartSelection,
  ChartViewResult,
  ChecklistItemKpis,
  ChecklistKpis,
  TimeBin,
} from '../../domain';
import { useFeatureDeps } from '../feature-deps';

export interface DashboardViewModel {
  isLoading: boolean;
  isError: boolean;
  /** Sem itens no recorte de filtros (a tela pode estar carregada, mas o filtro zerou). */
  isEmpty: boolean;
  /** KPIs de ronda do recorte (filtros + seleção de gráfico); `null` enquanto carrega/erro. */
  checklistKpis: ChecklistKpis | null;
  /** KPIs de item do recorte (filtros + seleção de gráfico); `null` enquanto carrega/erro. */
  itemKpis: ChecklistItemKpis | null;
  chart: ChartViewResult;
  scale: ChartScale;
  selection: ChartSelection | null;
  setScale(scale: ChartScale): void;
  selectBin(bin: TimeBin, result: ChartResult): void;
  clearSelection(): void;
}

export function useDashboardViewModel(): DashboardViewModel {
  const { useChecklistData, useAppState, buildChartData, buildChecklistView, filterChecklistsByChartSelection, now } =
    useFeatureDeps();

  const { checklists, isLoading, isError, lastUpdatedAt } = useChecklistData();
  const { state, setChartScale, selectChartBin, clearChartSelection } = useAppState();
  const { filters, search, sort, chartScale, chartSelection } = state;

  const chart = useMemo<ChartViewResult>(() => {
    const at = lastUpdatedAt ?? now();
    return buildChartData(checklists, filters, search, chartScale, chartSelection, at);
  }, [checklists, filters, search, chartScale, chartSelection, lastUpdatedAt, now, buildChartData]);

  // KPIs reaproveitam o mesmo pipeline determinístico (FR-003) e compõem com a seleção de
  // gráfico: ao haver `chartSelection`, recortamos as rondas pelo bin/resultado antes de
  // computar os indicadores, mantendo KPIs, tabela e gráficos coerentes (FR-008/012).
  const view = useMemo(() => {
    if (isLoading || isError) {
      return null;
    }
    const at = lastUpdatedAt ?? now();
    const scoped = chartSelection ? filterChecklistsByChartSelection(checklists, chartSelection, at) : checklists;
    return buildChecklistView(scoped, filters, search, sort, at);
  }, [
    checklists,
    filters,
    search,
    sort,
    chartSelection,
    isLoading,
    isError,
    lastUpdatedAt,
    now,
    buildChecklistView,
    filterChecklistsByChartSelection,
  ]);

  const isEmpty = !isLoading && !isError && chart.totalFilteredItems === 0;

  const selectBin = (bin: TimeBin, result: ChartResult): void => {
    selectChartBin({ scale: chartScale, binStart: bin.start, binEnd: bin.end, result, binLabel: bin.label });
  };

  return {
    isLoading,
    isError,
    isEmpty,
    checklistKpis: view?.checklistKpis ?? null,
    itemKpis: view?.itemKpis ?? null,
    chart,
    scale: chartScale,
    selection: chartSelection,
    setScale: setChartScale,
    selectBin,
    clearSelection: clearChartSelection,
  };
}

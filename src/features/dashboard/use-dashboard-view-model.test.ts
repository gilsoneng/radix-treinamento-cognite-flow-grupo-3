import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ChartViewResult, TimeBin } from '../../domain';
import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps, NOW } from '../__mocks__/checklist-fixtures';
import { FeatureDepsContext } from '../feature-deps';
import type { FeatureDeps } from '../feature-deps';

import { useDashboardViewModel } from './use-dashboard-view-model';

function wrapperFor(deps: FeatureDeps): ComponentType<{ children: ReactNode }> {
  return ({ children }: { children: ReactNode }) => createElement(FeatureDepsContext.Provider, { value: deps }, children);
}

function render(deps: FeatureDeps) {
  return renderHook(() => useDashboardViewModel(), { wrapper: wrapperFor(deps) });
}

const SAMPLE_RESULT: ChartViewResult = {
  scale: '30d',
  timeSeries: { scale: '30d', bins: [], ok: [], notOk: [] },
  instant: { ok: 5, notOk: 2, outros: 3, total: 10 },
  drillAssets: [],
  totalFilteredItems: 10,
  hasSelection: false,
};

describe(useDashboardViewModel.name, () => {
  it('chama buildChartData com o recorte do estado e o now injetado', () => {
    // Arrange
    const a = makeChecklist({ externalId: 'a' });
    const buildChartData = vi.fn(() => SAMPLE_RESULT);
    const filters = { status: [], onlyOverdue: false, priority: [], area: [], period: '30d' as const };
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [a] }),
      useAppState: () => makeAppStateApi({ filters, search: 'bomba', chartScale: '7d', chartSelection: null }),
      buildChartData,
    });

    // Act
    const { result } = render(deps);

    // Assert
    expect(buildChartData).toHaveBeenCalledWith([a], filters, 'bomba', '7d', null, NOW);
    expect(result.current.chart.instant.ok).toBe(5);
    expect(result.current.scale).toBe('7d');
  });

  it('isEmpty quando não há itens no recorte', () => {
    const deps = makeFeatureDeps({
      buildChartData: () => ({ ...SAMPLE_RESULT, totalFilteredItems: 0 }),
    });

    const { result } = render(deps);

    expect(result.current.isEmpty).toBe(true);
  });

  it('selectBin emite a seleção com a escala atual e o intervalo do bin (FR-008)', () => {
    const selectChartBin = vi.fn();
    const deps = makeFeatureDeps({
      useAppState: () => makeAppStateApi({ chartScale: '7d' }, { selectChartBin }),
    });
    const bin: TimeBin = { key: 'd-1', label: '15/05', start: 1000, end: 2000 };

    const { result } = render(deps);
    result.current.selectBin(bin, 'not_ok');

    expect(selectChartBin).toHaveBeenCalledWith({
      scale: '7d',
      binStart: 1000,
      binEnd: 2000,
      result: 'not_ok',
      binLabel: '15/05',
    });
  });

  it('setScale e clearSelection delegam aos setters host-synced', () => {
    const setChartScale = vi.fn();
    const clearChartSelection = vi.fn();
    const deps = makeFeatureDeps({
      useAppState: () => makeAppStateApi({}, { setChartScale, clearChartSelection }),
    });

    const { result } = render(deps);
    result.current.setScale('12m');
    result.current.clearSelection();

    expect(setChartScale).toHaveBeenCalledWith('12m');
    expect(clearChartSelection).toHaveBeenCalledTimes(1);
  });
});

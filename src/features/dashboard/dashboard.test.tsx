import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ChartSelection, ChartViewResult } from '../../domain';
import { makeAppStateApi, makeDataSource } from '../__mocks__/checklist-fixtures';
import type { FeatureDeps } from '../feature-deps';
import { FeatureDepsProvider } from '../feature-deps-provider';

import { Dashboard } from './dashboard';

function chartResult(overrides: Partial<ChartViewResult> = {}): ChartViewResult {
  return {
    scale: '30d',
    timeSeries: {
      scale: '30d',
      bins: [{ key: 'd-1', label: '15/05', start: 1000, end: 2000 }],
      ok: [4],
      notOk: [2],
    },
    instant: { ok: 4, notOk: 2, outros: 3, total: 9 },
    drillAssets: [],
    totalFilteredItems: 9,
    hasSelection: false,
    ...overrides,
  };
}

function renderDashboard(deps: Partial<FeatureDeps>) {
  return render(
    <FeatureDepsProvider deps={deps}>
      <Dashboard />
    </FeatureDepsProvider>
  );
}

describe('Dashboard', () => {
  it('mostra KPIs de itens e os dois gráficos quando há dados', () => {
    renderDashboard({
      useChecklistData: () => makeDataSource(),
      useAppState: () => makeAppStateApi(),
      buildChartData: () => chartResult(),
    });

    // KPIs consolidados de item.
    expect(screen.getByText('Itens (total)')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    // Os dois gráficos.
    expect(screen.getByRole('heading', { name: 'OK vs Not Ok' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OK/Not Ok ao longo do tempo' })).toBeInTheDocument();
    // Sem seleção → sem painel de drill-down.
    expect(screen.queryByLabelText('Ativos da seleção')).toBeNull();
  });

  it('com seleção ativa: mostra a nota de recorte e o painel de drill-down (FR-008/010)', () => {
    const selection: ChartSelection = { scale: '30d', binStart: 1000, binEnd: 2000, result: 'not_ok', binLabel: '15/05' };
    renderDashboard({
      useChecklistData: () => makeDataSource(),
      useAppState: () => makeAppStateApi({ chartSelection: selection }),
      buildChartData: () =>
        chartResult({ hasSelection: true, instant: { ok: 0, notOk: 2, outros: 0, total: 2 }, drillAssets: [{ externalId: 'a1', title: 'Bomba', count: 2 }] }),
    });

    expect(screen.getByRole('status')).toHaveTextContent(/refletem a seleção/);
    expect(screen.getByLabelText('Ativos da seleção')).toBeInTheDocument();
    expect(screen.getByText('Bomba')).toBeInTheDocument();
  });

  it('mostra estado vazio quando o recorte de filtros não tem itens (FR-016)', () => {
    renderDashboard({
      useChecklistData: () => makeDataSource(),
      useAppState: () => makeAppStateApi(),
      buildChartData: () => chartResult({ totalFilteredItems: 0, instant: { ok: 0, notOk: 0, outros: 0, total: 0 } }),
    });

    expect(screen.getByText('Nenhum item no recorte atual')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'OK vs Not Ok' })).toBeNull();
  });
});

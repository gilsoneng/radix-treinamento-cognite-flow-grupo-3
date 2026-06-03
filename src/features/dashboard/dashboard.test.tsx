import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type {
  ChartSelection,
  ChartViewResult,
  ChecklistItemKpis,
  ChecklistKpis,
  ChecklistViewResult,
} from '../../domain';
import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps } from '../__mocks__/checklist-fixtures';
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

const SAMPLE_CHECKLIST_KPIS: ChecklistKpis = {
  openCount: 5,
  overdueCount: 2,
  slaOnTimePercent: 80,
  byStatus: { aberto: 2, em_andamento: 1, atrasado: 2, concluido: 3 },
  byPriority: { alta: 1, media: 3, baixa: 4 },
  byArea: [
    { area: 'Área A', count: 4 },
    { area: 'Área B', count: 4 },
  ],
};

const SAMPLE_ITEM_KPIS: ChecklistItemKpis = {
  totalItems: 10,
  openItems: 6,
  overdueItems: 2,
  byItemStatus: { pendente: 4, ok: 6 },
};

function viewWith(checklistKpis: ChecklistKpis, itemKpis: ChecklistItemKpis): ChecklistViewResult {
  return { rows: [], checklistKpis, itemKpis };
}

function renderDashboard(overrides: Partial<FeatureDeps>) {
  return render(
    <FeatureDepsProvider deps={makeFeatureDeps(overrides)}>
      <Dashboard />
    </FeatureDepsProvider>
  );
}

describe(Dashboard.name, () => {
  it('mostra o estado de carregamento', () => {
    renderDashboard({ useChecklistData: () => makeDataSource({ isLoading: true }) });
    expect(screen.getByLabelText('Carregando indicadores')).toBeInTheDocument();
  });

  it('mostra o estado de erro', () => {
    renderDashboard({ useChecklistData: () => makeDataSource({ isError: true }) });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Erro ao carregar os indicadores/i)).toBeInTheDocument();
  });

  it('renderiza os KPIs de ronda e de item com ênfase em atrasados', () => {
    renderDashboard({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist()] }),
      buildChecklistView: (): ChecklistViewResult => viewWith(SAMPLE_CHECKLIST_KPIS, SAMPLE_ITEM_KPIS),
      buildChartData: () => chartResult(),
    });

    expect(screen.getByRole('status', { name: 'Abertos' })).toHaveTextContent('5');
    expect(screen.getByRole('status', { name: 'Atrasados' })).toHaveTextContent('2');
    expect(screen.getByText('Requer atenção')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Rondas')).toBeInTheDocument();
    expect(screen.getByText('Tarefas das rondas')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Tarefas atrasadas' })).toHaveTextContent('2');
  });

  it('mostra os indicadores OK/Not Ok e os dois gráficos quando há itens (FR-002/004)', () => {
    renderDashboard({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist()] }),
      buildChartData: () => chartResult(),
    });

    expect(screen.getByText('Itens (total)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OK vs Not Ok' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OK/Not Ok ao longo do tempo' })).toBeInTheDocument();
    // Sem seleção → sem painel de drill-down.
    expect(screen.queryByLabelText('Ativos da seleção')).toBeNull();
  });

  it('com seleção ativa: mostra a nota de recorte e o painel de drill-down (FR-008/010)', () => {
    const selection: ChartSelection = { scale: '30d', binStart: 1000, binEnd: 2000, result: 'not_ok', binLabel: '15/05' };
    renderDashboard({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist()] }),
      useAppState: () => makeAppStateApi({ chartSelection: selection }),
      buildChartData: () =>
        chartResult({
          hasSelection: true,
          instant: { ok: 0, notOk: 2, outros: 0, total: 2 },
          drillAssets: [{ externalId: 'a1', title: 'Bomba', count: 2 }],
        }),
    });

    expect(screen.getByText(/refletem a seleção/)).toBeInTheDocument();
    expect(screen.getByLabelText('Ativos da seleção')).toBeInTheDocument();
    expect(screen.getByText('Bomba')).toBeInTheDocument();
  });

  it('mostra estado vazio quando o recorte de filtros não tem itens (FR-016)', () => {
    renderDashboard({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist()] }),
      buildChartData: () => chartResult({ totalFilteredItems: 0, instant: { ok: 0, notOk: 0, outros: 0, total: 0 } }),
    });

    expect(screen.getByText('Nenhum item no recorte atual')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'OK vs Not Ok' })).toBeNull();
  });
});

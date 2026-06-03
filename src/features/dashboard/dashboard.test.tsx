import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Kpis } from '../_contracts';

import { Dashboard } from './dashboard';
import {
  DashboardViewModelContext,
  type DashboardViewModelContextType,
} from './use-dashboard-view-model';

const mockKpis: Kpis = {
  openCount: 5,
  overdueCount: 2,
  slaOnTimePercent: 80,
  byStatus: {
    aberto: 2,
    em_andamento: 1,
    atrasado: 2,
    concluido: 3,
  },
  byPriority: { alta: 1, media: 3, baixa: 4 },
  byArea: [
    { area: 'Área A', count: 4 },
    { area: 'Área B', count: 4 },
  ],
};

function makeVmContext(overrides: Partial<ReturnType<DashboardViewModelContextType['useChecklistData']>> & {
  kpis?: Kpis | null;
  isLoading?: boolean;
  isError?: boolean;
}): DashboardViewModelContextType {
  const { kpis = mockKpis, isLoading = false, isError = false, ...dataOverrides } = overrides;
  return {
    useChecklistData: vi.fn(() => ({
      checklists: [],
      isLoading,
      isError,
      error: isError ? new Error('fail') : null,
      lastUpdatedAt: 1_750_000_000_000,
      refresh: vi.fn(),
      ...dataOverrides,
    })),
    useAppState: vi.fn(() => ({
      state: {
        activeView: 'dashboard',
        filters: { status: [], onlyOverdue: false, priority: [], area: [], period: '30d' },
        sort: { key: 'prazo', dir: 'asc' },
        search: '',
        selectedChecklistId: null,
        detailOpen: false,
      },
      setActiveView: vi.fn(),
      setFilters: vi.fn(),
      setSort: vi.fn(),
      setSearch: vi.fn(),
      selectChecklist: vi.fn(),
      closeDetail: vi.fn(),
    })),
    applyFilters: vi.fn((cs) => cs),
    applySearch: vi.fn((cs) => cs),
    computeKpis: vi.fn(() => kpis ?? mockKpis),
    getNow: () => 1_750_000_000_000,
  };
}

function renderWithContext(ctx: DashboardViewModelContextType) {
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <DashboardViewModelContext.Provider value={ctx}>{children}</DashboardViewModelContext.Provider>
  );
  return render(<Dashboard />, { wrapper });
}

describe(Dashboard.name, () => {
  it('should render loading state', () => {
    renderWithContext(makeVmContext({ isLoading: true, kpis: null }));
    expect(screen.getByLabelText('Carregando indicadores')).toBeInTheDocument();
  });

  it('should render error state', () => {
    renderWithContext(makeVmContext({ isError: true, kpis: null }));
    expect(screen.getByText(/Não foi possível carregar os indicadores/i)).toBeInTheDocument();
  });

  it('should render empty state when KPIs show zero checklists', () => {
    const emptyKpis: Kpis = {
      openCount: 0,
      overdueCount: 0,
      slaOnTimePercent: 0,
      byStatus: { aberto: 0, em_andamento: 0, atrasado: 0, concluido: 0 },
      byPriority: { alta: 0, media: 0, baixa: 0 },
      byArea: [],
    };
    renderWithContext(makeVmContext({ kpis: emptyKpis }));
    expect(screen.getByText(/Nenhuma ronda no período/i)).toBeInTheDocument();
  });

  it('should render KPI cards with overdue emphasis', () => {
    renderWithContext(makeVmContext({}));
    expect(screen.getByRole('status', { name: 'Abertos' })).toHaveTextContent('5');
    expect(screen.getByRole('status', { name: 'Atrasados' })).toHaveTextContent('2');
    expect(screen.getByText('Requer atenção')).toBeInTheDocument();
    expect(screen.getByText('% no prazo (SLA)')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Por status')).toBeInTheDocument();
    expect(screen.getByText('Por prioridade')).toBeInTheDocument();
    expect(screen.getByText('Por área')).toBeInTheDocument();
  });
});

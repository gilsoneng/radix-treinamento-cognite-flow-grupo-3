import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ChecklistItemKpis, ChecklistKpis } from '../../domain';
import { DEFAULT_STATE } from '../../platform';

import { Dashboard } from './dashboard';
import {
  DashboardViewModelContext,
  type DashboardViewModelContextType,
} from './use-dashboard-view-model';

const mockChecklistKpis: ChecklistKpis = {
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

const mockItemKpis: ChecklistItemKpis = {
  totalItems: 10,
  openItems: 6,
  overdueItems: 2,
  byItemStatus: { pendente: 4, ok: 6 },
};

function makeVmContext(overrides: {
  isLoading?: boolean;
  isError?: boolean;
  checklistKpis?: ChecklistKpis | null;
  itemKpis?: ChecklistItemKpis | null;
}): DashboardViewModelContextType {
  const { isLoading = false, isError = false, checklistKpis = mockChecklistKpis, itemKpis = mockItemKpis } = overrides;
  return {
    useChecklistData: vi.fn(() => ({
      checklists: [],
      isLoading,
      isRefreshing: false,
      isError,
      error: isError ? new Error('fail') : null,
      lastUpdatedAt: 1_750_000_000_000,
      refresh: vi.fn(),
    })),
    useAppState: vi.fn(() => ({
      state: DEFAULT_STATE,
      setActiveView: vi.fn(),
      setFilters: vi.fn(),
      setSort: vi.fn(),
      setSearch: vi.fn(),
      selectChecklist: vi.fn(),
      closeDetail: vi.fn(),
    })),
    buildChecklistView: vi.fn(() => ({
      rows: [],
      checklistKpis: checklistKpis ?? mockChecklistKpis,
      itemKpis: itemKpis ?? mockItemKpis,
    })),
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
    renderWithContext(makeVmContext({ isLoading: true, checklistKpis: null, itemKpis: null }));
    expect(screen.getByLabelText('Carregando indicadores')).toBeInTheDocument();
  });

  it('should render error state', () => {
    renderWithContext(makeVmContext({ isError: true, checklistKpis: null, itemKpis: null }));
    expect(screen.getByText(/Não foi possível carregar os indicadores/i)).toBeInTheDocument();
  });

  it('should render empty state when KPIs show zero checklists', () => {
    const emptyKpis: ChecklistKpis = {
      openCount: 0,
      overdueCount: 0,
      slaOnTimePercent: 0,
      byStatus: { aberto: 0, em_andamento: 0, atrasado: 0, concluido: 0 },
      byPriority: { alta: 0, media: 0, baixa: 0 },
      byArea: [],
    };
    renderWithContext(makeVmContext({ checklistKpis: emptyKpis, itemKpis: { totalItems: 0, openItems: 0, overdueItems: 0, byItemStatus: {} } }));
    expect(screen.getByText(/Nenhuma ronda no recorte atual/i)).toBeInTheDocument();
  });

  it('should render checklist and item KPI cards with overdue emphasis', () => {
    renderWithContext(makeVmContext({}));
    expect(screen.getByRole('status', { name: 'Abertos' })).toHaveTextContent('5');
    expect(screen.getByRole('status', { name: 'Atrasados' })).toHaveTextContent('2');
    expect(screen.getByText('Requer atenção')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Rondas')).toBeInTheDocument();
    expect(screen.getByText('Tarefas das rondas')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Tarefas atrasadas' })).toHaveTextContent('2');
  });
});

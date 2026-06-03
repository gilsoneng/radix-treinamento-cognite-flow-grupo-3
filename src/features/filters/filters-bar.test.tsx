import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeChecklist } from '../../__mocks__/checklist';
import { DEFAULT_STATE } from '../../platform';
import type { AppStateContextValue , ChecklistDataSource } from '../../platform';


import { FiltersBar } from './filters-bar';
import {
  FiltersViewModelContext,
  type FiltersViewModelContextType,
} from './use-filters-view-model';

function makeContext(): FiltersViewModelContextType & { appActions: AppStateContextValue } {
  const setFilters = vi.fn();
  const setSort = vi.fn();
  const setSearch = vi.fn();
  const appActions: AppStateContextValue = {
    state: DEFAULT_STATE,
    setActiveView: vi.fn(),
    setFilters,
    setSort,
    setSearch,
    selectChecklist: vi.fn(),
    closeDetail: vi.fn(),
  };
  const data: ChecklistDataSource = {
    checklists: [
      makeChecklist({
        rootLocation: {
          externalId: 'a1',
          title: 'Área X',
          description: null,
          labels: [],
          source: null,
          sourceId: null,
          parent: null,
          root: null,
          createdTime: 0,
          lastUpdatedTime: 0,
        },
      }),
    ],
    isLoading: false,
    isRefreshing: false,
    isError: false,
    error: null,
    lastUpdatedAt: null,
    refresh: vi.fn(),
  };
  return {
    appActions,
    useAppState: vi.fn(() => appActions),
    useChecklistData: vi.fn(() => data),
    deriveArea: vi.fn((c) => c.rootLocation?.title ?? null),
  };
}

function renderBar(ctx: ReturnType<typeof makeContext>) {
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <FiltersViewModelContext.Provider value={ctx}>{children}</FiltersViewModelContext.Provider>
  );
  return render(<FiltersBar />, { wrapper });
}

describe(FiltersBar.name, () => {
  it('should render filter controls and search', () => {
    renderBar(makeContext());
    expect(screen.getByLabelText('Filtros e busca')).toBeInTheDocument();
    expect(screen.getByText(/Status/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Somente atrasados/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar por título ou ativo')).toBeInTheDocument();
    expect(screen.getByText('Ordenar por')).toBeInTheDocument();
  });

  it('should toggle only overdue via host-synced setFilters', async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    renderBar(ctx);

    await user.click(screen.getByRole('button', { name: /Somente atrasados/i }));

    expect(ctx.appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      onlyOverdue: true,
    });
  });

  it('should open the status dropdown and toggle a status filter', () => {
    const ctx = makeContext();
    renderBar(ctx);

    fireEvent.click(screen.getByRole('button', { name: /Status/ }));
    fireEvent.click(screen.getByText('Atrasado'));

    expect(ctx.appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      status: ['atrasado'],
    });
  });

  it('should open the priority dropdown and toggle a priority filter', () => {
    const ctx = makeContext();
    renderBar(ctx);

    fireEvent.click(screen.getByRole('button', { name: /Prioridade/ }));
    fireEvent.click(screen.getByText('Alta'));

    expect(ctx.appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      priority: ['alta'],
    });
  });

  it('should open the area dropdown and toggle an area filter', () => {
    const ctx = makeContext();
    renderBar(ctx);

    fireEvent.click(screen.getByRole('button', { name: /Área/ }));
    fireEvent.click(screen.getByText('Área X'));

    expect(ctx.appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      area: ['Área X'],
    });
  });

  it('should default period to 30d in app state', () => {
    const ctx = makeContext();
    renderBar(ctx);
    expect(ctx.appActions.state.filters.period).toBe('30d');
  });
});

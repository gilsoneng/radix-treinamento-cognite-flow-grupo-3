import { renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleChecklists } from '../__mocks__/checklists';
import { DEFAULT_STATE, type AppStateActions, type ChecklistDataSource, type Kpis } from '../_contracts';

import {
  DashboardViewModelContext,
  useDashboardViewModel,
  type DashboardViewModelContextType,
} from './use-dashboard-view-model';

const FIXED_NOW = 1_750_000_000_000;

const mockKpis: Kpis = {
  openCount: 2,
  overdueCount: 1,
  slaOnTimePercent: 75,
  byStatus: {
    aberto: 1,
    em_andamento: 1,
    atrasado: 1,
    concluido: 0,
  },
  byPriority: { alta: 1, media: 1, baixa: 1 },
  byArea: [
    { area: 'Área A', count: 2 },
    { area: 'Área B', count: 1 },
  ],
};

function makeDataSource(overrides: Partial<ChecklistDataSource> = {}): ChecklistDataSource {
  return {
    checklists: sampleChecklists,
    isLoading: false,
    isError: false,
    error: null,
    lastUpdatedAt: FIXED_NOW,
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeAppState(overrides: Partial<AppStateActions> = {}): AppStateActions {
  return {
    state: DEFAULT_STATE,
    setActiveView: vi.fn(),
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setSearch: vi.fn(),
    selectChecklist: vi.fn(),
    closeDetail: vi.fn(),
    ...overrides,
  };
}

describe(useDashboardViewModel.name, () => {
  let mockContext: DashboardViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useChecklistData: vi.fn(() => makeDataSource()),
      useAppState: vi.fn(() => makeAppState()),
      applyFilters: vi.fn((cs: typeof sampleChecklists) => cs),
      applySearch: vi.fn((cs: typeof sampleChecklists) => cs),
      computeKpis: vi.fn(() => mockKpis),
      getNow: () => FIXED_NOW,
    };
    wrapper = ({ children }) => (
      <DashboardViewModelContext.Provider value={mockContext}>{children}</DashboardViewModelContext.Provider>
    );
  });

  it('should expose loading state when data is loading', () => {
    vi.mocked(mockContext.useChecklistData).mockReturnValue(
      makeDataSource({ isLoading: true, checklists: [] })
    );

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.kpis).toBeNull();
  });

  it('should expose error state when data fetch fails', () => {
    vi.mocked(mockContext.useChecklistData).mockReturnValue(
      makeDataSource({ isError: true, error: new Error('cdf down'), checklists: [] })
    );

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.isError).toBe(true);
    expect(result.current.kpis).toBeNull();
  });

  it('should compute KPIs from filtered and searched checklists on success', () => {
    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.kpis).toEqual(mockKpis);
    expect(result.current.lastUpdatedAt).toBe(FIXED_NOW);
    expect(mockContext.applyFilters).toHaveBeenCalledWith(
      sampleChecklists,
      DEFAULT_STATE.filters,
      FIXED_NOW
    );
    expect(mockContext.applySearch).toHaveBeenCalledWith(sampleChecklists, DEFAULT_STATE.search);
    expect(mockContext.computeKpis).toHaveBeenCalledWith(sampleChecklists, FIXED_NOW);
  });

  it('should recompute KPIs when filters change', () => {
    const filteredOnlyOverdue = [sampleChecklists[1]];
    const overdueKpis: Kpis = { ...mockKpis, openCount: 0, overdueCount: 1 };
    vi.mocked(mockContext.applyFilters).mockReturnValue(filteredOnlyOverdue);
    vi.mocked(mockContext.computeKpis).mockReturnValue(overdueKpis);
    vi.mocked(mockContext.useAppState).mockReturnValue(
      makeAppState({
        state: {
          ...DEFAULT_STATE,
          filters: { ...DEFAULT_STATE.filters, onlyOverdue: true, area: ['Área B'] },
        },
      })
    );

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.kpis?.overdueCount).toBe(1);
    expect(mockContext.applyFilters).toHaveBeenCalledWith(
      sampleChecklists,
      expect.objectContaining({ onlyOverdue: true, area: ['Área B'] }),
      FIXED_NOW
    );
    expect(mockContext.computeKpis).toHaveBeenCalledWith(filteredOnlyOverdue, FIXED_NOW);
  });

  it('should delegate refresh to checklist data source', () => {
    const data = makeDataSource();
    vi.mocked(mockContext.useChecklistData).mockReturnValue(data);

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });
    result.current.refresh();

    expect(data.refresh).toHaveBeenCalled();
  });
});

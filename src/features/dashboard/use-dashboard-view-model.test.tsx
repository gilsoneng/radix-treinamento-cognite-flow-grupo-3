import { renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FILTERS } from '../../domain';
import type { ChecklistItemKpis, ChecklistKpis } from '../../domain';
import { buildDomainFixtureChecklists } from '../../domain/__fixtures__/checklists';
import { DEFAULT_STATE } from '../../platform';
import type { AppStateContextValue , ChecklistDataSource } from '../../platform';


import {
  DashboardViewModelContext,
  useDashboardViewModel,
  type DashboardViewModelContextType,
} from './use-dashboard-view-model';

const FIXED_NOW = 1_750_000_000_000;
const sampleChecklists = buildDomainFixtureChecklists();

const mockChecklistKpis: ChecklistKpis = {
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

const mockItemKpis: ChecklistItemKpis = {
  totalItems: 5,
  openItems: 3,
  overdueItems: 1,
  byItemStatus: { pendente: 2, ok: 3 },
};

function makeDataSource(overrides: Partial<ChecklistDataSource> = {}): ChecklistDataSource {
  return {
    checklists: sampleChecklists,
    isLoading: false,
    isRefreshing: false,
    isError: false,
    error: null,
    lastUpdatedAt: FIXED_NOW,
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeAppState(overrides: Partial<AppStateContextValue> = {}): AppStateContextValue {
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
      buildChecklistView: vi.fn(() => ({
        rows: sampleChecklists,
        checklistKpis: mockChecklistKpis,
        itemKpis: mockItemKpis,
      })),
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
    expect(result.current.checklistKpis).toBeNull();
  });

  it('should expose error state when data fetch fails', () => {
    vi.mocked(mockContext.useChecklistData).mockReturnValue(
      makeDataSource({ isError: true, error: new Error('cdf down'), checklists: [] })
    );

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.isError).toBe(true);
    expect(result.current.checklistKpis).toBeNull();
  });

  it('should compute KPIs via buildChecklistView on success', () => {
    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.checklistKpis).toEqual(mockChecklistKpis);
    expect(result.current.itemKpis).toEqual(mockItemKpis);
    expect(result.current.lastUpdatedAt).toBe(FIXED_NOW);
    expect(mockContext.buildChecklistView).toHaveBeenCalledWith(
      sampleChecklists,
      DEFAULT_STATE.filters,
      DEFAULT_STATE.search,
      DEFAULT_STATE.sort,
      FIXED_NOW
    );
  });

  it('should recompute KPIs when filters change', () => {
    const overdueKpis: ChecklistKpis = { ...mockChecklistKpis, openCount: 0, overdueCount: 1 };
    vi.mocked(mockContext.buildChecklistView).mockReturnValue({
      rows: [sampleChecklists[0]],
      checklistKpis: overdueKpis,
      itemKpis: mockItemKpis,
    });
    vi.mocked(mockContext.useAppState).mockReturnValue(
      makeAppState({
        state: {
          ...DEFAULT_STATE,
          filters: { ...DEFAULT_FILTERS, onlyOverdue: true },
        },
      })
    );

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });

    expect(result.current.checklistKpis?.overdueCount).toBe(1);
    expect(mockContext.buildChecklistView).toHaveBeenCalledWith(
      sampleChecklists,
      expect.objectContaining({ onlyOverdue: true }),
      DEFAULT_STATE.search,
      DEFAULT_STATE.sort,
      FIXED_NOW
    );
  });

  it('should delegate refresh to checklist data source', () => {
    const data = makeDataSource();
    vi.mocked(mockContext.useChecklistData).mockReturnValue(data);

    const { result } = renderHook(() => useDashboardViewModel(), { wrapper });
    result.current.refresh();

    expect(data.refresh).toHaveBeenCalled();
  });
});

import { renderHook, act } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleChecklists } from '../__mocks__/checklists';
import { DEFAULT_STATE, type AppStateActions, type ChecklistDataSource, type Filters } from '../_contracts';

import {
  FiltersViewModelContext,
  useFiltersViewModel,
  type FiltersViewModelContextType,
} from './use-filters-view-model';

function makeDataSource(): ChecklistDataSource {
  return {
    checklists: sampleChecklists,
    isLoading: false,
    isError: false,
    error: null,
    lastUpdatedAt: null,
    refresh: vi.fn(),
  };
}

function makeAppState(overrides: Partial<AppStateActions> = {}): AppStateActions {
  const setFilters = vi.fn();
  const setSort = vi.fn();
  const setSearch = vi.fn();
  return {
    state: DEFAULT_STATE,
    setActiveView: vi.fn(),
    setFilters,
    setSort,
    setSearch,
    selectChecklist: vi.fn(),
    closeDetail: vi.fn(),
    ...overrides,
  };
}

describe(useFiltersViewModel.name, () => {
  let mockContext: FiltersViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let appActions: AppStateActions;

  beforeEach(() => {
    appActions = makeAppState();
    mockContext = {
      useAppState: vi.fn(() => appActions),
      useChecklistData: vi.fn(() => makeDataSource()),
    };
    wrapper = ({ children }) => (
      <FiltersViewModelContext.Provider value={mockContext}>{children}</FiltersViewModelContext.Provider>
    );
  });

  it('should expose current filters, sort and search from app state', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    expect(result.current.filters).toEqual(DEFAULT_STATE.filters);
    expect(result.current.sort).toEqual(DEFAULT_STATE.sort);
    expect(result.current.search).toEqual('');
    expect(result.current.filters.period).toBe('30d');
  });

  it('should delegate setFilters to host-synced setter', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    const next: Filters = { ...DEFAULT_STATE.filters, onlyOverdue: true };
    act(() => {
      result.current.setFilters(next);
    });
    expect(appActions.setFilters).toHaveBeenCalledWith(next);
  });

  it('should toggle status filter via toggleStatusFilter', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    act(() => {
      result.current.toggleStatusFilter('atrasado');
    });
    expect(appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      status: ['atrasado'],
    });
  });

  it('should toggle onlyOverdue filter', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    act(() => {
      result.current.toggleOnlyOverdue();
    });
    expect(appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      onlyOverdue: true,
    });
  });

  it('should set period via setPeriod', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    act(() => {
      result.current.setPeriod('90d');
    });
    expect(appActions.setFilters).toHaveBeenCalledWith({
      ...DEFAULT_STATE.filters,
      period: '90d',
    });
  });

  it('should derive available areas from checklists rootLocation', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    expect(result.current.availableAreas).toEqual(['Área A', 'Área B']);
  });

  it('should expose status and priority option lists', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    expect(result.current.statusOptions.map((o) => o.value)).toContain('atrasado');
    expect(result.current.priorityOptions.map((o) => o.value)).toContain('alta');
    expect(result.current.periodOptions.map((o) => o.value)).toContain('30d');
  });

  it('should delegate setSort and setSearch to host-synced setters', () => {
    const { result } = renderHook(() => useFiltersViewModel(), { wrapper });
    act(() => {
      result.current.setSort({ key: 'status', dir: 'desc' });
      result.current.setSearch('bomba');
    });
    expect(appActions.setSort).toHaveBeenCalledWith({ key: 'status', dir: 'desc' });
    expect(appActions.setSearch).toHaveBeenCalledWith('bomba');
  });
});

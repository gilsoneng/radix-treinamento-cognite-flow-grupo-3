import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklist } from '../../__mocks__/checklist';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';
import type { Checklist } from '../../types/apm';

import { FiltersViewModelContext, useFiltersViewModel } from './use-filters-view-model';
import type { FiltersViewModelDeps } from './use-filters-view-model';

function render(appState: AppStateContextValue, checklists: Checklist[] = []) {
  const deps: FiltersViewModelDeps = {
    useChecklistData: () => makeChecklistDataSource({ checklists }),
    useAppState: () => appState,
    now: () => 1_717_000_000_000,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FiltersViewModelContext.Provider value={deps}>{children}</FiltersViewModelContext.Provider>
  );
  return renderHook(() => useFiltersViewModel(), { wrapper });
}

describe('useFiltersViewModel', () => {
  it('toggleStatus adiciona e remove um balde mantendo os demais', () => {
    // Arrange — já existe 'atrasado' selecionado
    const appState = makeAppState({ filters: { status: ['atrasado'], onlyOverdue: false, priority: [], area: [], period: '30d' } });
    const { result } = render(appState);

    // Act — adiciona 'aberto'
    act(() => result.current.toggleStatus('aberto'));

    // Assert
    expect(appState.setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ status: ['atrasado', 'aberto'] })
    );
  });

  it('toggleOnlyOverdue inverte o booleano', () => {
    const appState = makeAppState();
    const { result } = render(appState);

    act(() => result.current.toggleOnlyOverdue());

    expect(appState.setFilters).toHaveBeenCalledWith(expect.objectContaining({ onlyOverdue: true }));
  });

  it('setArea encapsula a área como lista (ou vazia para "todas")', () => {
    const appState = makeAppState();
    const { result } = render(appState);

    act(() => result.current.setArea('Linha 1'));
    expect(appState.setFilters).toHaveBeenCalledWith(expect.objectContaining({ area: ['Linha 1'] }));

    act(() => result.current.setArea(null));
    expect(appState.setFilters).toHaveBeenCalledWith(expect.objectContaining({ area: [] }));
  });

  it('availableAreas deriva áreas distintas e ordenadas dos dados', () => {
    const checklists = [
      makeChecklist({ externalId: 'a', rootLocation: { externalId: 'r1', title: 'Linha 2', description: null, labels: [], source: null, sourceId: null, parent: null, root: null, createdTime: 0, lastUpdatedTime: 0 } }),
      makeChecklist({ externalId: 'b', rootLocation: { externalId: 'r2', title: 'Linha 1', description: null, labels: [], source: null, sourceId: null, parent: null, root: null, createdTime: 0, lastUpdatedTime: 0 } }),
    ];
    const { result } = render(makeAppState(), checklists);

    expect(result.current.availableAreas).toEqual(['Linha 1', 'Linha 2']);
  });

  it('activeFilterCount conta recortes ativos (período != 30d conta)', () => {
    const appState = makeAppState({
      filters: { status: ['atrasado'], onlyOverdue: true, priority: ['alta'], area: ['Linha 1'], period: '90d' },
    });
    const { result } = render(appState);

    // 1 status + 1 prioridade + 1 área + onlyOverdue + período != 30d = 5
    expect(result.current.activeFilterCount).toBe(5);
  });

  it('clearFilters volta ao padrão (período 30d)', () => {
    const appState = makeAppState({ filters: { status: ['atrasado'], onlyOverdue: true, priority: [], area: [], period: '7d' } });
    const { result } = render(appState);

    act(() => result.current.clearFilters());

    expect(appState.setFilters).toHaveBeenCalledWith({ status: [], onlyOverdue: false, priority: [], area: [], period: '30d' });
  });

  it('setSearch delega ao host (host-synced, não local)', () => {
    const appState = makeAppState();
    const { result } = render(appState);

    act(() => result.current.setSearch('bomba'));

    expect(appState.setSearch).toHaveBeenCalledWith('bomba');
  });
});

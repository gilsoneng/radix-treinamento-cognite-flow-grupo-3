import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklist } from '../../__mocks__/checklist';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';
import type { Checklist } from '../../types/apm';

import { ChecklistListViewModelContext, useChecklistListViewModel } from './use-checklist-list-view-model';
import type { ChecklistListViewModelDeps } from './use-checklist-list-view-model';

const NOW = Date.UTC(2026, 5, 3);

function render(checklists: Checklist[], appState: AppStateContextValue) {
  const deps: ChecklistListViewModelDeps = {
    useChecklistData: () => makeChecklistDataSource({ checklists }),
    useAppState: () => appState,
    now: () => NOW,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChecklistListViewModelContext.Provider value={deps}>{children}</ChecklistListViewModelContext.Provider>
  );
  return renderHook(() => useChecklistListViewModel(), { wrapper });
}

describe('useChecklistListViewModel', () => {
  it('deriva cada linha (status/prioridade/prazo/responsável) e marca atrasada', () => {
    const checklists = [
      makeChecklist({ externalId: 'atrasada', title: 'Ronda X', status: 'To Do', endTime: '2020-01-01T00:00:00.000Z', assignedTo: ['Ana'] }),
    ];
    const { result } = render(checklists, makeAppState({ filters: { status: [], onlyOverdue: false, priority: [], area: [], period: 'all' } }));

    const row = result.current.rows[0];
    expect(row?.title).toBe('Ronda X');
    expect(row?.statusBucket).toBe('atrasado');
    expect(row?.priority).toBe('alta'); // atrasado → alta
    expect(row?.isOverdue).toBe(true);
    expect(row?.assignedToLabel).toBe('Ana');
  });

  it('toggleSort inverte a direção na mesma coluna', () => {
    const appState = makeAppState({ sort: { key: 'prazo', dir: 'asc' } });
    const { result } = render([], appState);

    act(() => result.current.toggleSort('prazo'));

    expect(appState.setSort).toHaveBeenCalledWith({ key: 'prazo', dir: 'desc' });
  });

  it('toggleSort numa coluna nova começa em asc', () => {
    const appState = makeAppState({ sort: { key: 'prazo', dir: 'desc' } });
    const { result } = render([], appState);

    act(() => result.current.toggleSort('status'));

    expect(appState.setSort).toHaveBeenCalledWith({ key: 'status', dir: 'asc' });
  });

  it('selectChecklist delega ao host (host-synced)', () => {
    const appState = makeAppState();
    const checklists = [makeChecklist({ externalId: 'c1' })];
    const { result } = render(checklists, appState);

    act(() => result.current.selectChecklist('c1'));

    expect(appState.selectChecklist).toHaveBeenCalledWith('c1');
  });

  it('marca a linha selecionada', () => {
    const checklists = [makeChecklist({ externalId: 'c1' }), makeChecklist({ externalId: 'c2' })];
    const appState = makeAppState({ selectedChecklistId: 'c2', filters: { status: [], onlyOverdue: false, priority: [], area: [], period: 'all' } });
    const { result } = render(checklists, appState);

    expect(result.current.rows.find((r) => r.externalId === 'c2')?.isSelected).toBe(true);
    expect(result.current.rows.find((r) => r.externalId === 'c1')?.isSelected).toBe(false);
  });
});

import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklist } from '../../__mocks__/checklist';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';
import type { Checklist, ChecklistItem } from '../../types/apm';

import { ChecklistDetailViewModelContext, useChecklistDetailViewModel } from './use-checklist-detail-view-model';

const NOW = Date.UTC(2026, 5, 3);

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    externalId: 'item-1',
    title: 'Verificar bomba',
    description: null,
    status: 'OK',
    order: 1,
    note: null,
    labels: [],
    visibility: 'PUBLIC',
    isArchived: false,
    startTime: null,
    endTime: null,
    sourceId: null,
    source: null,
    asset: null,
    createdBy: null,
    updatedBy: null,
    measurements: [],
    createdTime: 0,
    lastUpdatedTime: 0,
    ...overrides,
  };
}

function render(checklists: Checklist[], appState: AppStateContextValue) {
  const deps = {
    useChecklistData: () => makeChecklistDataSource({ checklists }),
    useAppState: () => appState,
    now: () => NOW,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChecklistDetailViewModelContext.Provider value={deps}>{children}</ChecklistDetailViewModelContext.Provider>
  );
  return renderHook(() => useChecklistDetailViewModel(), { wrapper });
}

describe('useChecklistDetailViewModel', () => {
  it('fica fechado quando não há ronda selecionada', () => {
    const { result } = render([makeChecklist()], makeAppState({ selectedChecklistId: null, detailOpen: false }));
    expect(result.current.isOpen).toBe(false);
  });

  it('abre e expõe os itens da ronda selecionada (FR-007)', () => {
    const checklist = makeChecklist({ externalId: 'c1', title: 'Ronda Beta', items: [makeItem({ externalId: 'i1', title: 'Tarefa 1', status: 'OK' })] });
    const { result } = render([checklist], makeAppState({ selectedChecklistId: 'c1', detailOpen: true }));

    expect(result.current.isOpen).toBe(true);
    expect(result.current.title).toBe('Ronda Beta');
    expect(result.current.itemRows).toHaveLength(1);
    expect(result.current.itemRows[0]?.statusBucket).toBe('ok');
  });

  it('fica fechado quando o id selecionado não existe nos dados', () => {
    const { result } = render([makeChecklist({ externalId: 'c1' })], makeAppState({ selectedChecklistId: 'inexistente', detailOpen: true }));
    expect(result.current.isOpen).toBe(false);
  });

  it('close() delega ao host', () => {
    const appState = makeAppState({ selectedChecklistId: 'c1', detailOpen: true });
    const { result } = render([makeChecklist({ externalId: 'c1' })], appState);

    act(() => result.current.close());

    expect(appState.closeDetail).toHaveBeenCalledTimes(1);
  });
});

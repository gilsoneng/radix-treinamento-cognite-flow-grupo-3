import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps, makeItem, NOW } from '../__mocks__/checklist-fixtures';
import { FeatureDepsContext } from '../feature-deps';
import type { FeatureDeps } from '../feature-deps';

import { useChecklistDetailViewModel } from './use-checklist-detail-view-model';

function wrapperFor(deps: FeatureDeps): ComponentType<{ children: ReactNode }> {
  return ({ children }: { children: ReactNode }) =>
    createElement(FeatureDepsContext.Provider, { value: deps }, children);
}

function render(deps: FeatureDeps) {
  return renderHook(() => useChecklistDetailViewModel(), { wrapper: wrapperFor(deps) });
}

describe(useChecklistDetailViewModel.name, () => {
  it('deriva a ronda selecionada pelo id e abre quando detailOpen', () => {
    // Arrange
    const target = makeChecklist({ externalId: 'c2', title: 'Ronda alvo' });
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1' }), target] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c2', detailOpen: true }),
    });

    // Act
    const { result } = render(deps);

    // Assert
    expect(result.current.checklist?.externalId).toBe('c2');
    expect(result.current.isOpen).toBe(true);
  });

  it('classifica os itens da ronda selecionada usando o domínio', () => {
    const item = makeItem({ externalId: 'item-42' });
    const classifyItemStatus = vi.fn<FeatureDeps['classifyItemStatus']>(() => 'not_ok');
    const deps = makeFeatureDeps({
      useChecklistData: () =>
        makeDataSource({ checklists: [makeChecklist({ externalId: 'c1', items: [item] })], lastUpdatedAt: NOW }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c1', detailOpen: true }),
      classifyItemStatus,
    });

    const { result } = render(deps);

    expect(classifyItemStatus).toHaveBeenCalledWith(item, NOW);
    expect(result.current.itemStatusById).toEqual({ 'item-42': 'not_ok' });
  });

  it('retorna null e fechado quando não há seleção', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1' })] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: null, detailOpen: false }),
    });

    const { result } = render(deps);

    expect(result.current.checklist).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('retorna null quando o id selecionado não existe na lista', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1' })] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'inexistente', detailOpen: true }),
    });

    const { result } = render(deps);

    expect(result.current.checklist).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('não abre quando detailOpen é false mesmo com ronda encontrada', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1' })] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c1', detailOpen: false }),
    });

    const { result } = render(deps);

    expect(result.current.checklist?.externalId).toBe('c1');
    expect(result.current.isOpen).toBe(false);
  });

  it('close() delega para closeDetail', () => {
    const closeDetail = vi.fn();
    const deps = makeFeatureDeps({ useAppState: () => makeAppStateApi({}, { closeDetail }) });

    const { result } = render(deps);
    result.current.close();

    expect(closeDetail).toHaveBeenCalledTimes(1);
  });
});

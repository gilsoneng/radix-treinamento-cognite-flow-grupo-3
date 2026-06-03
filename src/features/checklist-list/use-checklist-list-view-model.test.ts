import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  makeAppStateApi,
  makeChecklist,
  makeDataSource,
  makeFeatureDeps,
  NOW,
} from '../__mocks__/checklist-fixtures';
import type { Filters, SortState } from '../contracts';
import { FeatureDepsContext } from '../feature-deps';
import type { FeatureDeps } from '../feature-deps';

import { useChecklistListViewModel } from './use-checklist-list-view-model';

function wrapperFor(deps: FeatureDeps): ComponentType<{ children: ReactNode }> {
  return ({ children }: { children: ReactNode }) =>
    createElement(FeatureDepsContext.Provider, { value: deps }, children);
}

function render(deps: FeatureDeps) {
  return renderHook(() => useChecklistListViewModel(), { wrapper: wrapperFor(deps) });
}

describe(useChecklistListViewModel.name, () => {
  it('expõe estado de carregamento', () => {
    // Arrange
    const deps = makeFeatureDeps({ useChecklistData: () => makeDataSource({ isLoading: true }) });

    // Act
    const { result } = render(deps);

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.rows).toEqual([]);
  });

  it('expõe estado de erro', () => {
    const deps = makeFeatureDeps({ useChecklistData: () => makeDataSource({ isError: true, error: new Error('x') }) });

    const { result } = render(deps);

    expect(result.current.isError).toBe(true);
    expect(result.current.isEmpty).toBe(false);
  });

  it('expõe estado vazio quando não há rondas após filtros', () => {
    const deps = makeFeatureDeps({ useChecklistData: () => makeDataSource({ checklists: [] }) });

    const { result } = render(deps);

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.rows).toEqual([]);
  });

  it('deriva cada linha (status, prioridade, área, responsável, prazo)', () => {
    // Arrange
    const checklist = makeChecklist({
      externalId: 'c1',
      title: 'Ronda 7º andar',
      assignedTo: ['Alex Morgan', 'Jordan Lee'],
      endTime: '2026-05-20T12:00:00.000Z',
    });
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [checklist] }),
      classifyStatus: () => 'atrasado',
      isOverdue: () => true,
      derivePriority: () => 'alta',
      deriveArea: () => 'Linha A',
    });

    // Act
    const { result } = render(deps);

    // Assert
    expect(result.current.rows).toHaveLength(1);
    const row = result.current.rows[0];
    expect(row.id).toBe('c1');
    expect(row.title).toBe('Ronda 7º andar');
    expect(row.assignedTo).toBe('Alex Morgan, Jordan Lee');
    expect(row.status).toBe('atrasado');
    expect(row.isOverdue).toBe(true);
    expect(row.priority).toBe('alta');
    expect(row.area).toBe('Linha A');
    expect(row.endTime).toBe('2026-05-20T12:00:00.000Z');
  });

  it('usa o pipeline único do domínio com filtros, busca, ordenação e now injetado', () => {
    // Arrange
    const a = makeChecklist({ externalId: 'a' });
    const b = makeChecklist({ externalId: 'b' });
    const c = makeChecklist({ externalId: 'c' });
    const buildChecklistView = vi.fn(() => ({
      rows: [b, a],
      checklistKpis: {
        openCount: 0,
        overdueCount: 0,
        slaOnTimePercent: 100,
        byStatus: { aberto: 0, em_andamento: 0, atrasado: 0, concluido: 0 },
        byPriority: { alta: 0, media: 0, baixa: 0 },
        byArea: [],
      },
      itemKpis: { totalItems: 0, openItems: 0, overdueItems: 0, byItemStatus: {} },
    }));
    const filters: Filters = { status: [], onlyOverdue: true, priority: [], area: [], period: '30d' };
    const sort: SortState = { key: 'status', dir: 'desc' };
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [a, b, c] }),
      useAppState: () => makeAppStateApi({ filters, sort, search: 'bomba' }),
      buildChecklistView,
    });

    // Act
    const { result } = render(deps);

    // Assert
    expect(buildChecklistView).toHaveBeenCalledWith([a, b, c], filters, 'bomba', sort, NOW);
    expect(result.current.rows.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('toggleSort inverte a direção quando a coluna já está ativa', () => {
    const setSort = vi.fn();
    const deps = makeFeatureDeps({
      useAppState: () => makeAppStateApi({ sort: { key: 'prazo', dir: 'asc' } }, { setSort }),
    });

    const { result } = render(deps);
    result.current.toggleSort('prazo');

    expect(setSort).toHaveBeenCalledWith({ key: 'prazo', dir: 'desc' });
  });

  it('toggleSort troca a coluna iniciando em asc', () => {
    const setSort = vi.fn();
    const deps = makeFeatureDeps({
      useAppState: () => makeAppStateApi({ sort: { key: 'prazo', dir: 'desc' } }, { setSort }),
    });

    const { result } = render(deps);
    result.current.toggleSort('status');

    expect(setSort).toHaveBeenCalledWith({ key: 'status', dir: 'asc' });
  });

  it('aplica o cross-filter do gráfico recortando as rondas pela seleção (FR-008)', () => {
    // Arrange
    const a = makeChecklist({ externalId: 'a' });
    const b = makeChecklist({ externalId: 'b' });
    const selection = { scale: '7d' as const, binStart: 1, binEnd: 2, result: 'not_ok' as const, binLabel: '15/05' };
    const filterChecklistsByChartSelection = vi.fn(() => [b]);
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [a, b] }),
      useAppState: () => makeAppStateApi({ chartSelection: selection }),
      filterChecklistsByChartSelection,
    });

    // Act
    const { result } = render(deps);

    // Assert — só a ronda que a seleção mantém aparece.
    expect(filterChecklistsByChartSelection).toHaveBeenCalledWith([a, b], selection, NOW);
    expect(result.current.rows.map((r) => r.id)).toEqual(['b']);
  });

  it('não chama o cross-filter quando não há seleção de gráfico', () => {
    const filterChecklistsByChartSelection = vi.fn(() => []);
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'a' })] }),
      filterChecklistsByChartSelection,
    });

    const { result } = render(deps);

    expect(filterChecklistsByChartSelection).not.toHaveBeenCalled();
    expect(result.current.rows.map((r) => r.id)).toEqual(['a']);
  });

  it('selectRow seleciona a ronda pelo id', () => {
    const selectChecklist = vi.fn();
    const deps = makeFeatureDeps({ useAppState: () => makeAppStateApi({}, { selectChecklist }) });

    const { result } = render(deps);
    result.current.selectRow('c-42');

    expect(selectChecklist).toHaveBeenCalledWith('c-42');
  });
});

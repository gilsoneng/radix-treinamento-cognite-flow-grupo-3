import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps } from '../__mocks__/checklist-fixtures';
import { FeatureDepsContext } from '../feature-deps';
import type { FeatureDeps } from '../feature-deps';

import { ChecklistTable } from './checklist-table';

function renderTable(deps: FeatureDeps) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(FeatureDepsContext.Provider, { value: deps }, children);
  return render(<ChecklistTable />, { wrapper });
}

describe(ChecklistTable.name, () => {
  it('lista as rondas', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () =>
        makeDataSource({
          checklists: [makeChecklist({ externalId: 'a', title: 'Ronda A' }), makeChecklist({ externalId: 'b', title: 'Ronda B' })],
        }),
    });

    renderTable(deps);

    expect(screen.getByText('Ronda A')).toBeInTheDocument();
    expect(screen.getByText('Ronda B')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há rondas', () => {
    const deps = makeFeatureDeps({ useChecklistData: () => makeDataSource({ checklists: [] }) });

    renderTable(deps);

    expect(screen.getByText('Nenhuma ronda no período')).toBeInTheDocument();
  });

  it('mostra estado de carregamento', () => {
    const deps = makeFeatureDeps({ useChecklistData: () => makeDataSource({ isLoading: true }) });

    renderTable(deps);

    expect(screen.getByText('Carregando rondas...')).toBeInTheDocument();
  });

  it('mostra estado de erro', () => {
    const deps = makeFeatureDeps({ useChecklistData: () => makeDataSource({ isError: true }) });

    renderTable(deps);

    expect(screen.getByText(/Não foi possível carregar as rondas/)).toBeInTheDocument();
  });

  it('ordena pelo cabeçalho de Prazo (host-synced via setSort)', async () => {
    const setSort = vi.fn();
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'a' })] }),
      useAppState: () => makeAppStateApi({ sort: { key: 'prazo', dir: 'asc' } }, { setSort }),
    });

    renderTable(deps);
    await userEvent.click(screen.getByRole('button', { name: /Prazo/ }));

    expect(setSort).toHaveBeenCalledWith({ key: 'prazo', dir: 'desc' });
  });

  it('ordena pelo cabeçalho de Status iniciando em asc', async () => {
    const setSort = vi.fn();
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'a' })] }),
      useAppState: () => makeAppStateApi({ sort: { key: 'prazo', dir: 'asc' } }, { setSort }),
    });

    renderTable(deps);
    await userEvent.click(screen.getByRole('button', { name: /Status/ }));

    expect(setSort).toHaveBeenCalledWith({ key: 'status', dir: 'asc' });
  });
});

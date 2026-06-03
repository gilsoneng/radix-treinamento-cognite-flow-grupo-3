import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';

import { FiltersBar } from './filters-bar';
import { FiltersViewModelContext } from './use-filters-view-model';
import type { FiltersViewModelDeps } from './use-filters-view-model';

function renderBar(appState: AppStateContextValue) {
  const deps: FiltersViewModelDeps = {
    useChecklistData: () => makeChecklistDataSource(),
    useAppState: () => appState,
    now: () => 1_717_000_000_000,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FiltersViewModelContext.Provider value={deps}>{children}</FiltersViewModelContext.Provider>
  );
  return render(<FiltersBar />, { wrapper });
}

describe('FiltersBar', () => {
  it('marca o chip de status ativo com aria-pressed', () => {
    const appState = makeAppState({ filters: { status: ['atrasado'], onlyOverdue: false, priority: [], area: [], period: '30d' } });
    renderBar(appState);

    expect(screen.getByRole('button', { name: 'Atrasado' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aberto' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicar num chip de status aplica o filtro (host-synced)', async () => {
    const appState = makeAppState();
    renderBar(appState);

    await userEvent.click(screen.getByRole('button', { name: 'Aberto' }));

    expect(appState.setFilters).toHaveBeenCalledWith(expect.objectContaining({ status: ['aberto'] }));
  });

  it('alterna o período pelo seletor', async () => {
    const appState = makeAppState();
    renderBar(appState);

    await userEvent.selectOptions(screen.getByLabelText('Período'), '7d');

    expect(appState.setFilters).toHaveBeenCalledWith(expect.objectContaining({ period: '7d' }));
  });

  it('digitar na busca delega ao host', async () => {
    const appState = makeAppState();
    renderBar(appState);

    await userEvent.type(screen.getByLabelText(/Buscar por título/), 'X');

    expect(appState.setSearch).toHaveBeenCalled();
  });

  it('inverte a direção de ordenação', async () => {
    const appState = makeAppState({ sort: { key: 'prazo', dir: 'asc' } });
    renderBar(appState);

    await userEvent.click(screen.getByRole('button', { name: 'Ordem crescente' }));

    expect(appState.setSort).toHaveBeenCalledWith({ key: 'prazo', dir: 'desc' });
  });

  it('mostra "Limpar" apenas quando há filtros ativos', () => {
    const appState = makeAppState({ filters: { status: ['atrasado'], onlyOverdue: false, priority: [], area: [], period: '30d' } });
    renderBar(appState);

    expect(screen.getByRole('button', { name: /Limpar/ })).toBeInTheDocument();
  });
});

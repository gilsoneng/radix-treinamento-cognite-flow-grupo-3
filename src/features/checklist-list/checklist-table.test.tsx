import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklist } from '../../__mocks__/checklist';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';
import type { Checklist } from '../../types/apm';

import { ChecklistTable } from './checklist-table';
import { ChecklistListViewModelContext } from './use-checklist-list-view-model';

const NOW = Date.UTC(2026, 5, 3);
const ALL_PERIOD = { status: [], onlyOverdue: false, priority: [], area: [], period: 'all' as const };

function renderTable(checklists: Checklist[], appState: AppStateContextValue) {
  const deps = {
    useChecklistData: () => makeChecklistDataSource({ checklists }),
    useAppState: () => appState,
    now: () => NOW,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChecklistListViewModelContext.Provider value={deps}>{children}</ChecklistListViewModelContext.Provider>
  );
  return render(<ChecklistTable />, { wrapper });
}

describe('ChecklistTable', () => {
  it('lista as rondas com título e status', () => {
    const checklists = [makeChecklist({ externalId: 'c1', title: 'Ronda Alfa', status: 'To Do', endTime: '2020-01-01T00:00:00.000Z' })];
    renderTable(checklists, makeAppState({ filters: ALL_PERIOD }));

    expect(screen.getByRole('button', { name: 'Ronda Alfa' })).toBeInTheDocument();
    expect(screen.getByText('Atrasado')).toBeInTheDocument(); // destaque de atrasado com texto
  });

  it('clicar no título seleciona a ronda (abre detalhe)', async () => {
    const appState = makeAppState({ filters: ALL_PERIOD });
    renderTable([makeChecklist({ externalId: 'c1', title: 'Ronda Alfa' })], appState);

    await userEvent.click(screen.getByRole('button', { name: 'Ronda Alfa' }));

    expect(appState.selectChecklist).toHaveBeenCalledWith('c1');
  });

  it('clicar no cabeçalho "Status" ordena por status', async () => {
    const appState = makeAppState({ sort: { key: 'prazo', dir: 'asc' }, filters: ALL_PERIOD });
    renderTable([makeChecklist({ externalId: 'c1' })], appState);

    await userEvent.click(screen.getByRole('button', { name: /Status/ }));

    expect(appState.setSort).toHaveBeenCalledWith({ key: 'status', dir: 'asc' });
  });

  it('mostra estado vazio quando nada casa o filtro', () => {
    renderTable([], makeAppState());
    expect(screen.getByText(/Nenhuma ronda corresponde aos filtros/)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklist } from '../../__mocks__/checklist';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';
import type { Checklist } from '../../types/apm';

import { ChecklistDetailDrawer } from './checklist-detail-drawer';
import { ChecklistDetailViewModelContext } from './use-checklist-detail-view-model';

function renderDrawer(checklists: Checklist[], appState: AppStateContextValue) {
  const deps = {
    useChecklistData: () => makeChecklistDataSource({ checklists }),
    useAppState: () => appState,
    now: () => Date.UTC(2026, 5, 3),
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChecklistDetailViewModelContext.Provider value={deps}>{children}</ChecklistDetailViewModelContext.Provider>
  );
  return render(<ChecklistDetailDrawer />, { wrapper });
}

describe('ChecklistDetailDrawer', () => {
  it('não renderiza nada quando fechado', () => {
    renderDrawer([makeChecklist()], makeAppState({ detailOpen: false }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza o detalhe da ronda selecionada', () => {
    const checklist = makeChecklist({ externalId: 'c1', title: 'Ronda Gama' });
    renderDrawer([checklist], makeAppState({ selectedChecklistId: 'c1', detailOpen: true }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ronda Gama')).toBeInTheDocument();
  });

  it('o botão fechar chama closeDetail', async () => {
    const appState = makeAppState({ selectedChecklistId: 'c1', detailOpen: true });
    renderDrawer([makeChecklist({ externalId: 'c1' })], appState);

    await userEvent.click(screen.getByRole('button', { name: 'Fechar detalhe' }));

    expect(appState.closeDetail).toHaveBeenCalled();
  });

  it('Esc fecha o drawer', async () => {
    const appState = makeAppState({ selectedChecklistId: 'c1', detailOpen: true });
    renderDrawer([makeChecklist({ externalId: 'c1' })], appState);

    await userEvent.keyboard('{Escape}');

    expect(appState.closeDetail).toHaveBeenCalled();
  });
});

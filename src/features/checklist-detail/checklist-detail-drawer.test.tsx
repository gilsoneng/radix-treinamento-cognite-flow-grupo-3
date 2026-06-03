import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps, makeItem } from '../__mocks__/checklist-fixtures';
import { FeatureDepsContext } from '../feature-deps';
import type { FeatureDeps } from '../feature-deps';

import { ChecklistDetailDrawer } from './checklist-detail-drawer';

function renderDrawer(deps: FeatureDeps) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(FeatureDepsContext.Provider, { value: deps }, children);
  return render(<ChecklistDetailDrawer />, { wrapper });
}

describe(ChecklistDetailDrawer.name, () => {
  it('abre com o título e as tarefas da ronda selecionada', () => {
    const checklist = makeChecklist({
      externalId: 'c1',
      title: 'Ronda da caldeira',
      items: [makeItem({ externalId: 'i1', title: 'Inspecionar válvula' })],
    });
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [checklist] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c1', detailOpen: true }),
    });

    renderDrawer(deps);

    expect(screen.getByText('Ronda da caldeira')).toBeInTheDocument();
    expect(screen.getByText('Inspecionar válvula')).toBeInTheDocument();
  });

  it('não renderiza nada quando o detalhe está fechado', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1', title: 'Ronda X' })] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c1', detailOpen: false }),
    });

    renderDrawer(deps);

    expect(screen.queryByText('Ronda X')).not.toBeInTheDocument();
  });

  it('mostra mensagem quando a ronda não tem tarefas', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1', items: [] })] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c1', detailOpen: true }),
    });

    renderDrawer(deps);

    expect(screen.getByText('Esta ronda não tem tarefas.')).toBeInTheDocument();
  });

  it('fecha o detalhe ao acionar o botão de fechar (host-synced)', async () => {
    const closeDetail = vi.fn();
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1', title: 'Ronda Y' })] }),
      useAppState: () => makeAppStateApi({ selectedChecklistId: 'c1', detailOpen: true }, { closeDetail }),
    });

    renderDrawer(deps);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar detalhe' }));

    expect(closeDetail).toHaveBeenCalledTimes(1);
  });
});

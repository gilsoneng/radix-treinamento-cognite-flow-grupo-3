import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeChecklist } from '../__mocks__/checklist-fixtures';

import { ChecklistRow } from './checklist-row';
import type { ChecklistRowVM } from './use-checklist-list-view-model';

function makeRow(overrides: Partial<ChecklistRowVM> = {}): ChecklistRowVM {
  return {
    id: 'c1',
    title: 'Ronda 7º andar',
    assignedTo: 'Alex Morgan, Jordan Lee',
    status: 'em_andamento',
    isOverdue: false,
    endTime: '2026-05-20T12:00:00.000Z',
    priority: 'media',
    area: 'Linha A',
    raw: makeChecklist({ externalId: 'c1' }),
    ...overrides,
  };
}

function renderInTable(node: ReactElement) {
  return render(
    <table>
      <tbody>{node}</tbody>
    </table>
  );
}

describe(ChecklistRow.name, () => {
  it('renderiza as colunas mínimas com prazo formatado', () => {
    renderInTable(<ChecklistRow row={makeRow()} selected={false} onSelect={vi.fn()} />);

    expect(screen.getByText('Ronda 7º andar')).toBeInTheDocument();
    expect(screen.getByText('Alex Morgan, Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('20/05/2026')).toBeInTheDocument();
    expect(screen.getByText('Média')).toBeInTheDocument();
    expect(screen.getByText('Linha A')).toBeInTheDocument();
  });

  it('seleciona a ronda ao clicar no título', async () => {
    const onSelect = vi.fn();
    renderInTable(<ChecklistRow row={makeRow({ id: 'c-42' })} selected={false} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ronda 7º andar' }));

    expect(onSelect).toHaveBeenCalledWith('c-42');
  });

  it('destaca rondas atrasadas com badge "Atrasado" e marcador de linha', () => {
    renderInTable(<ChecklistRow row={makeRow({ status: 'atrasado', isOverdue: true })} selected={false} onSelect={vi.fn()} />);

    expect(screen.getByText('Atrasado')).toBeInTheDocument();
    expect(screen.getByRole('row')).toHaveAttribute('data-overdue');
  });

  it('mostra "—" quando não há responsável ou área', () => {
    renderInTable(<ChecklistRow row={makeRow({ assignedTo: '', area: null })} selected={false} onSelect={vi.fn()} />);

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });
});

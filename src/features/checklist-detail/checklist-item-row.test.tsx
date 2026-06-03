import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAsset, makeItem, makeMeasurement } from '../__mocks__/checklist-fixtures';

import { ChecklistItemRow } from './checklist-item-row';

function renderInList(node: ReactElement) {
  return render(<ul>{node}</ul>);
}

describe(ChecklistItemRow.name, () => {
  it('mostra título, status individual e ativo', () => {
    const item = makeItem({ title: 'Verificar vazamento', status: 'Not OK', asset: makeAsset({ title: 'Bomba 1' }) });

    renderInList(<ChecklistItemRow item={item} status="not_ok" />);

    expect(screen.getByText('Verificar vazamento')).toBeInTheDocument();
    expect(screen.getByText('Not OK')).toBeInTheDocument();
    expect(screen.getByText('Bomba 1')).toBeInTheDocument();
  });

  it('mostra "Sem ativo" e "Pendente" quando faltam dados', () => {
    const item = makeItem({ status: null, asset: null });

    renderInList(<ChecklistItemRow item={item} status="pendente" />);

    expect(screen.getByText('Sem ativo')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('exibe as medições quando houver', () => {
    const item = makeItem({ measurements: [makeMeasurement({ title: 'Temperatura', type: 'numerical', max: 170 })] });

    renderInList(<ChecklistItemRow item={item} status="ok" />);

    expect(screen.getByText(/Temperatura/)).toBeInTheDocument();
  });

  it('não renderiza lista de medições quando não houver', () => {
    const item = makeItem({ title: 'Tarefa sem medição', measurements: [] });

    const { container } = renderInList(<ChecklistItemRow item={item} status="pendente" />);

    expect(container.querySelector('li ul')).toBeNull();
  });
});

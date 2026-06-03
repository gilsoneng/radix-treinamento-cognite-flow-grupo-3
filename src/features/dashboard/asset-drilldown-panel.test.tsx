import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ChartSelection } from '../../domain';

import { AssetDrilldownPanel } from './asset-drilldown-panel';

const SELECTION: ChartSelection = { scale: '7d', binStart: 1, binEnd: 2, result: 'not_ok', binLabel: '15/05' };

describe('AssetDrilldownPanel', () => {
  it('descreve a seleção e lista os assets com contagem (FR-010)', () => {
    render(
      <AssetDrilldownPanel
        selection={SELECTION}
        assets={[
          { externalId: 'a1', title: 'Bomba', count: 2 },
          { externalId: 'a2', title: 'Compressor', count: 1 },
        ]}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByText('Not Ok')).toBeInTheDocument();
    expect(screen.getByText('15/05')).toBeInTheDocument();
    expect(screen.getByText('3 itens em 2 ativos')).toBeInTheDocument();
    expect(screen.getByText('Bomba')).toBeInTheDocument();
    expect(screen.getByText('Compressor')).toBeInTheDocument();
  });

  it('mostra estado vazio quando a seleção não tem assets', () => {
    render(<AssetDrilldownPanel selection={SELECTION} assets={[]} onClear={vi.fn()} />);

    expect(screen.getByText('Nenhum ativo para esta seleção.')).toBeInTheDocument();
  });

  it('aciona limpar seleção (FR-011)', async () => {
    const onClear = vi.fn();
    render(<AssetDrilldownPanel selection={SELECTION} assets={[]} onClear={onClear} />);

    await userEvent.click(screen.getByRole('button', { name: /Limpar seleção/ }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

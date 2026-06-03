import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ChartSelection, ChartTimeSeries, TimeBin } from '../../domain';

import { OkNotOkTimelineChart } from './ok-notok-timeline-chart';

const BINS: TimeBin[] = [
  { key: 'd-1', label: '14/05', start: 1000, end: 2000 },
  { key: 'd-2', label: '15/05', start: 2000, end: 3000 },
];

function makeSeries(ok: number[], notOk: number[]): ChartTimeSeries {
  return { scale: '7d', bins: BINS, ok, notOk };
}

describe('OkNotOkTimelineChart', () => {
  it('renderiza uma barra clicável por valor > 0 e nenhuma para valor 0', () => {
    render(<OkNotOkTimelineChart series={makeSeries([1, 2], [0, 3])} selection={null} onSelect={vi.fn()} />);

    // bin 14/05: OK=1 (barra), Not Ok=0 (sem barra). bin 15/05: OK=2 e Not Ok=3 (barras).
    expect(screen.getByRole('button', { name: /OK em 14\/05: 1 item/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Not Ok em 14\/05/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Not Ok em 15\/05: 3 itens/ })).toBeInTheDocument();
  });

  it('clicar numa barra emite a combinação (bin, série) — FR-008', () => {
    const onSelect = vi.fn();
    render(<OkNotOkTimelineChart series={makeSeries([1, 2], [0, 3])} selection={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Not Ok em 15\/05: 3 itens/ }));

    expect(onSelect).toHaveBeenCalledWith(BINS[1], 'not_ok');
  });

  it('aciona a seleção pelo teclado (Enter)', () => {
    const onSelect = vi.fn();
    render(<OkNotOkTimelineChart series={makeSeries([1, 2], [0, 3])} selection={null} onSelect={onSelect} />);

    fireEvent.keyDown(screen.getByRole('button', { name: /OK em 15\/05: 2 itens/ }), { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(BINS[1], 'ok');
  });

  it('realça a barra selecionada com aria-pressed', () => {
    const selection: ChartSelection = { scale: '7d', binStart: 2000, binEnd: 3000, result: 'not_ok', binLabel: '15/05' };
    render(<OkNotOkTimelineChart series={makeSeries([1, 2], [0, 3])} selection={selection} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Not Ok em 15\/05: 3 itens/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /OK em 15\/05: 2 itens/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('mostra um aviso quando não há itens OK/Not Ok no período', () => {
    render(<OkNotOkTimelineChart series={makeSeries([0, 0], [0, 0])} selection={null} onSelect={vi.fn()} />);

    expect(screen.getByText('Sem itens OK/Not Ok no período')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChartScaleSelector } from './chart-scale-selector';

describe('ChartScaleSelector', () => {
  it('marca a escala ativa com aria-pressed e oferece as três escalas', () => {
    render(<ChartScaleSelector scale="30d" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '12 meses' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('emite a troca de escala ao clicar', async () => {
    const onChange = vi.fn();
    render(<ChartScaleSelector scale="30d" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: '12 meses' }));

    expect(onChange).toHaveBeenCalledWith('12m');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ViewSwitcher } from './view-switcher';

describe('ViewSwitcher', () => {
  it('marca a visão ativa com aria-pressed (acessível, não só por cor)', () => {
    render(<ViewSwitcher active="dashboard" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Dashboard/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Lista/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('emite a troca de visão ao clicar', async () => {
    const onChange = vi.fn();
    render(<ViewSwitcher active="dashboard" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Lista/ }));

    expect(onChange).toHaveBeenCalledWith('list');
  });
});

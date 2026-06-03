import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { formatLastUpdatedLabel } from './format-last-updated';
import { LastUpdated } from './last-updated';

describe('formatLastUpdatedLabel', () => {
  it('indica ausência de atualização quando é null', () => {
    expect(formatLastUpdatedLabel(null)).toBe('Sem atualização ainda');
  });

  it('formata o horário quando há timestamp', () => {
    const label = formatLastUpdatedLabel(Date.UTC(2026, 5, 3, 12, 0, 0));
    expect(label).toMatch(/^Atualizado às /);
  });
});

describe('LastUpdated', () => {
  it('renderiza o rótulo e chama onRefresh ao clicar', async () => {
    // Arrange
    const onRefresh = vi.fn();
    render(<LastUpdated lastUpdatedAt={null} isRefreshing={false} onRefresh={onRefresh} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: /Atualizar/ }));

    // Assert
    expect(screen.getByText('Sem atualização ainda')).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('desabilita o botão e mostra "Atualizando…" durante o refresh', () => {
    render(<LastUpdated lastUpdatedAt={1717418400000} isRefreshing onRefresh={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Atualizando/ });
    expect(button).toBeDisabled();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ItemStatusBadge, PriorityBadge, StatusBadge } from './badges';

describe('StatusBadge', () => {
  it('mostra o rótulo "Atrasado" (texto, não só cor)', () => {
    render(<StatusBadge bucket="atrasado" />);
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('mostra "Concluído" para o balde concluido', () => {
    render(<StatusBadge bucket="concluido" />);
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it('mostra o rótulo da prioridade', () => {
    render(<PriorityBadge priority="alta" />);
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });
});

describe('ItemStatusBadge', () => {
  it('mostra o rótulo do status do item', () => {
    render(<ItemStatusBadge bucket="not_ok" />);
    expect(screen.getByText('Not OK')).toBeInTheDocument();
  });
});

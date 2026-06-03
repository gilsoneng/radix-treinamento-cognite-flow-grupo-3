import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ShellContent } from './shell-content';
import { toErrorMessage } from './to-error-message';

describe('toErrorMessage', () => {
  it('usa a mensagem do Error quando disponível', () => {
    expect(toErrorMessage(new Error('timeout no CDF'))).toBe('timeout no CDF');
  });

  it('usa um texto genérico para erros desconhecidos', () => {
    expect(toErrorMessage('algo')).toMatch(/Não foi possível consultar o CDF/);
  });
});

describe('ShellContent', () => {
  const base = { activeView: 'dashboard' as const, isLoading: false, isError: false, error: null, checklistCount: 3 };

  it('mostra o estado de carregamento', () => {
    render(<ShellContent {...base} isLoading />);
    expect(screen.getByText('Carregando rondas do CDF…')).toBeInTheDocument();
  });

  it('mostra o estado de erro com a mensagem', () => {
    render(<ShellContent {...base} isError error={new Error('falhou')} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('falhou')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há rondas', () => {
    render(<ShellContent {...base} checklistCount={0} />);
    expect(screen.getByText('Nenhuma ronda no período')).toBeInTheDocument();
  });

  it('mostra o slot do Dashboard quando a visão ativa é dashboard', () => {
    render(<ShellContent {...base} activeView="dashboard" />);
    expect(screen.getByText('Dashboard de KPIs')).toBeInTheDocument();
    expect(screen.getByText(/3 rondas carregadas/)).toBeInTheDocument();
  });

  it('mostra o slot da Lista quando a visão ativa é list', () => {
    render(<ShellContent {...base} activeView="list" />);
    expect(screen.getByText('Lista de Checklists')).toBeInTheDocument();
  });
});

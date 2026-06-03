import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeatureDepsProvider } from '../../features';
import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps } from '../../features/__mocks__/checklist-fixtures';

import { ShellContent } from './shell-content';
import { toErrorMessage } from './to-error-message';

// `DashboardSlot` monta `DashboardFeature`; mockamos a feature para testar só o roteamento do shell.
vi.mock('../../features/dashboard/dashboard-feature', () => ({
  DashboardFeature: () => <div aria-label="Dashboard de KPIs">Dashboard DEV 3</div>,
}));

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

  it('mostra a feature do Dashboard quando a visão ativa é dashboard', () => {
    // `DashboardSlot` monta `DashboardFeature` (mockada acima) — aqui só validamos o roteamento
    // do shell; o conteúdo real do dashboard é coberto por `dashboard.test.tsx`.
    render(<ShellContent {...base} activeView="dashboard" />);
    expect(screen.getByLabelText('Dashboard de KPIs')).toBeInTheDocument();
  });

  it('mostra o slot da Lista quando a visão ativa é list', () => {
    const checklist = makeChecklist({ externalId: 'c1', title: 'Ronda integrada' });
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [checklist] }),
      useAppState: () => makeAppStateApi({ activeView: 'list' }),
    });

    render(
      <FeatureDepsProvider deps={deps}>
        <ShellContent {...base} activeView="list" />
      </FeatureDepsProvider>
    );

    expect(screen.getByText('Lista de Checklists')).toBeInTheDocument();
    expect(screen.getByText('Ronda integrada')).toBeInTheDocument();
  });
});

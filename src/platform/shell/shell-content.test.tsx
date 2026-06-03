import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeatureDepsProvider } from '../../features';
import { makeAppStateApi, makeChecklist, makeDataSource, makeFeatureDeps } from '../../features/__mocks__/checklist-fixtures';

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

  it('mostra o slot do Dashboard (gráficos) quando a visão ativa é dashboard', () => {
    const deps = makeFeatureDeps({
      useChecklistData: () => makeDataSource({ checklists: [makeChecklist({ externalId: 'c1' })] }),
      useAppState: () => makeAppStateApi({ activeView: 'dashboard' }),
      buildChartData: (_all, _filters, _search, scale, selection) => ({
        scale,
        timeSeries: { scale, bins: [{ key: 'd-1', label: '15/05', start: 1, end: 2 }], ok: [1], notOk: [0] },
        instant: { ok: 1, notOk: 0, outros: 0, total: 1 },
        drillAssets: [],
        totalFilteredItems: 1,
        hasSelection: selection !== null,
      }),
    });

    render(
      <FeatureDepsProvider deps={deps}>
        <ShellContent {...base} activeView="dashboard" />
      </FeatureDepsProvider>
    );

    // O Dashboard real renderiza os KPIs de item e os títulos dos gráficos.
    expect(screen.getByText('Itens (total)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OK/Not Ok ao longo do tempo' })).toBeInTheDocument();
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

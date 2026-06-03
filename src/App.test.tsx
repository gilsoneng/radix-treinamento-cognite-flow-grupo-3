import type { ConnectToHostAppResult } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeChecklist } from './__mocks__/checklist';
import { makeHostAppApi } from './__mocks__/host-app-api';
import App from './App';
import { ChecklistDataContext, defaultChecklistDataDeps } from './platform';
import type { ChecklistDataDeps } from './platform';
import type { Group3DataService } from './services/group3';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

function makeService(checklistCount: number): Group3DataService {
  const checklists = Array.from({ length: checklistCount }, (_unused, i) => makeChecklist({ externalId: `c-${i}` }));
  return {
    getChecklists: vi.fn(() => Promise.resolve(checklists)),
    getChecklistItems: vi.fn(() => Promise.resolve([])),
    getMeasurementReadings: vi.fn(() => Promise.resolve([])),
    getAssets: vi.fn(() => Promise.resolve([])),
    getUsers: vi.fn(() => Promise.resolve([])),
  };
}

function makeConnectedDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({ api: makeHostAppApi(), initialState: undefined })
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => new Promise<ConnectToHostAppResult>(() => undefined)),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function renderApp(deps: AppDeps, service: Group3DataService) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Mantém o client real (vindo do provider), troca só o service por um fake sem rede.
  const checklistDeps: ChecklistDataDeps = {
    useCogniteSdk: defaultChecklistDataDeps.useCogniteSdk,
    createService: () => service,
  };
  const wrapper = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <ChecklistDataContext.Provider value={checklistDeps}>{children}</ChecklistDataContext.Provider>
    </QueryClientProvider>
  );
  return render(wrapper(<App deps={deps} />));
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o estado de conexão enquanto o host não responde', () => {
    renderApp(makeLoadingDeps(), makeService(0));
    expect(screen.getByText('Conectando ao projeto…')).toBeInTheDocument();
  });

  it('renderiza o shell e o conteúdo com os dados do CDF quando conecta', async () => {
    // Arrange / Act
    renderApp(makeConnectedDeps(), makeService(2));

    // Assert — shell montado
    await waitFor(() => expect(screen.getByText('Action Items de Chão de Fábrica')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lista/ })).toBeInTheDocument();

    // Assert — conteúdo com a contagem real de rondas
    await waitFor(() => expect(screen.getByText(/2 rondas carregadas do CDF/)).toBeInTheDocument());
  });

  it('mostra o estado vazio quando não há rondas', async () => {
    renderApp(makeConnectedDeps(), makeService(0));

    await waitFor(() => expect(screen.getByText('Nenhuma ronda no período')).toBeInTheDocument());
  });
});

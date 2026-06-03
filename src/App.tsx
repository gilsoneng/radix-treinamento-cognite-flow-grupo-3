/**
 * Composition root da aplicação (DEV 1). Apenas compõe os providers, na ordem certa, em
 * volta do shell — sem regra de negócio. Cada provider tem uma responsabilidade única:
 *
 *   CogniteSdkProvider   → handshake com o host + `CogniteClient` autenticado (FR-013)
 *     HostAppApiProvider → expõe a `HostAppAPI` + `initialState` (FR-011/FR-013)
 *       AppStateProvider → store do estado host-synced, seed/sync com a URL (FR-011)
 *         AppShell       → layout + estados de carregando/erro/vazio (FR-012)
 *           DashboardView / ChecklistListView → features DEV 3/DEV 4, injetadas como slots
 *
 * O `QueryClientProvider` é provido no `main.tsx` (bootstrap), acima de `<App/>`.
 *
 * As visões das features são injetadas aqui (no topo do grafo de dependências), mantendo a
 * plataforma agnóstica às features (a plataforma só renderiza os nós recebidos — Open/Closed).
 *
 * `deps` é injetável para testes: o mesmo `connectToHostApp` mockado alimenta tanto o
 * `CogniteSdkProvider` quanto o `HostAppApiProvider` (que compartilham o handshake memoizado).
 */

import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import type { ComponentProps } from 'react';

import { ChecklistListView, DashboardView } from './features';
import { HostAppApiProvider } from './platform/host/host-app-api-provider';
import { AppShell } from './platform/shell/app-shell';
import { ErrorScreen, LoadingScreen } from './platform/shell/status-screens';
import { AppStateProvider } from './platform/state/app-state-provider';

const loadingFallback = <LoadingScreen message="Conectando ao projeto…" />;
const errorFallback = <ErrorScreen message="Não foi possível conectar ao host Fusion." />;

type AppProps = {
  deps?: ComponentProps<typeof CogniteSdkProvider>['deps'];
};

function App({ deps }: AppProps) {
  return (
    <CogniteSdkProvider loadingFallback={loadingFallback} errorFallback={errorFallback} deps={deps}>
      <HostAppApiProvider connectToHostApp={deps?.connectToHostApp}>
        <AppStateProvider>
          <AppShell dashboardView={<DashboardView />} listView={<ChecklistListView />} />
        </AppStateProvider>
      </HostAppApiProvider>
    </CogniteSdkProvider>
  );
}

export default App;

/**
 * Conecta-se ao host Fusion e disponibiliza `{ api, initialState }` à árvore via contexto.
 *
 * `connectToHostApp` é MEMOIZADO em nível de módulo no `@cognite/app-sdk`: o
 * `CogniteSdkProvider` já dispara o handshake, então esta segunda chamada resolve com o
 * MESMO resultado em cache — sem um segundo handshake real. Mantemos um provider próprio
 * porque o `useCogniteSdk()` expõe só o `CogniteClient`, não a `HostAppAPI` (que tem o
 * `syncInternalState` de que o estado host-synced precisa — FR-011/FR-013).
 *
 * `connectToHostApp` é injetável (DI, CLAUDE.md §3) para os testes não tocarem o host real.
 */

import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { LoadingScreen, ErrorScreen } from '../shell/status-screens';

import { HostAppApiContext } from './host-app-api-context';
import type { HostAppApiContextValue } from './host-app-api-context';

/** Nome da aplicação (externalId em `app.json`). Rótulo do handshake, não é segredo. */
const APPLICATION_NAME = 'xpto-app';

type ConnectToHostApp = typeof connectToHostAppImpl;

type ConnectionState =
  | { status: 'connecting' }
  | { status: 'ready'; value: HostAppApiContextValue }
  | { status: 'error'; message: string };

export interface HostAppApiProviderProps {
  children: ReactNode;
  /** Injetável nos testes; em produção usa a implementação memoizada do SDK. */
  connectToHostApp?: ConnectToHostApp;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
}

export function HostAppApiProvider({
  children,
  connectToHostApp = connectToHostAppImpl,
  loadingFallback,
  errorFallback,
}: HostAppApiProviderProps) {
  const [connection, setConnection] = useState<ConnectionState>({ status: 'connecting' });

  useEffect(() => {
    let cancelled = false;
    connectToHostApp({ applicationName: APPLICATION_NAME })
      .then(({ api, initialState }) => {
        if (!cancelled) {
          setConnection({ status: 'ready', value: { api, initialState } });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Falha ao conectar ao host Fusion.';
          setConnection({ status: 'error', message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [connectToHostApp]);

  if (connection.status === 'connecting') {
    return <>{loadingFallback ?? <LoadingScreen message="Conectando ao Fusion…" />}</>;
  }

  if (connection.status === 'error') {
    return <>{errorFallback ?? <ErrorScreen message={connection.message} />}</>;
  }

  return <HostAppApiContext.Provider value={connection.value}>{children}</HostAppApiContext.Provider>;
}

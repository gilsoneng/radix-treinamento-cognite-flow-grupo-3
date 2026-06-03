/**
 * Acessa a `HostAppAPI` + `initialState` providos pelo `HostAppApiProvider`.
 * Lança erro explícito se usado fora do provider (falha rápido, não retorna `null`).
 */

import { useContext } from 'react';

import { HostAppApiContext } from './host-app-api-context';
import type { HostAppApiContextValue } from './host-app-api-context';

export function useHostAppApi(): HostAppApiContextValue {
  const value = useContext(HostAppApiContext);
  if (value === null) {
    throw new Error('useHostAppApi deve ser usado dentro de <HostAppApiProvider>.');
  }
  return value;
}

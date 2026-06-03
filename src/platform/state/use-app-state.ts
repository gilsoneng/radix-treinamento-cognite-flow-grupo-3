/**
 * Acessa a store de estado host-synced. Lança erro explícito se usado fora do
 * `AppStateProvider` (falha rápido em vez de devolver `null`).
 */

import { useContext } from 'react';

import { AppStateContext } from './app-state-context';
import type { AppStateContextValue } from './app-state-context';

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext);
  if (value === null) {
    throw new Error('useAppState deve ser usado dentro de <AppStateProvider>.');
  }
  return value;
}

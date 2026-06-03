/**
 * Fábrica de `AppStateContextValue` falso (setters como `vi.fn`) para testar ViewModels
 * que dependem de `useAppState`. Sobrescreva apenas o pedaço de `state` que o teste observa.
 */

import { vi } from 'vitest';

import { DEFAULT_STATE } from '../platform';
import type { AppState, AppStateContextValue } from '../platform';

export function makeAppState(state: Partial<AppState> = {}): AppStateContextValue {
  return {
    state: { ...DEFAULT_STATE, ...state },
    setActiveView: vi.fn(),
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setSearch: vi.fn(),
    selectChecklist: vi.fn(),
    closeDetail: vi.fn(),
  };
}

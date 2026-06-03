/**
 * Fábrica de `ChecklistDataSource` falso para testar ViewModels que dependem de
 * `useChecklistData` sem React Query nem rede.
 */

import { vi } from 'vitest';

import type { ChecklistDataSource } from '../platform';

export function makeChecklistDataSource(overrides: Partial<ChecklistDataSource> = {}): ChecklistDataSource {
  return {
    checklists: [],
    isLoading: false,
    isRefreshing: false,
    isError: false,
    error: null,
    lastUpdatedAt: 1_717_000_000_000,
    refresh: vi.fn(),
    ...overrides,
  };
}

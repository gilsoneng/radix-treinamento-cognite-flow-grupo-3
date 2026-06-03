import type { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeChecklist } from '../../__mocks__/checklist';
import type { Group3DataService } from '../../services/group3';

import { ChecklistDataContext, REFRESH_INTERVAL_MS } from './checklist-data-context';
import type { ChecklistDataDeps } from './checklist-data-context';
import { useChecklistData } from './use-checklist-data';

// Cliente CDF nunca é usado pelo fake service; basta satisfazer o tipo (mock §7).
const clientStub: CogniteClient = {} as Partial<CogniteClient> as CogniteClient;

function makeService(overrides: Partial<Group3DataService> = {}): Group3DataService {
  return {
    getChecklists: vi.fn(() => Promise.resolve([makeChecklist()])),
    getChecklistItems: vi.fn(() => Promise.resolve([])),
    getMeasurementReadings: vi.fn(() => Promise.resolve([])),
    getAssets: vi.fn(() => Promise.resolve([])),
    getUsers: vi.fn(() => Promise.resolve([])),
    ...overrides,
  };
}

function renderChecklistData(service: Group3DataService) {
  const deps: ChecklistDataDeps = { useCogniteSdk: () => clientStub, createService: () => service };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ChecklistDataContext.Provider value={deps}>{children}</ChecklistDataContext.Provider>
    </QueryClientProvider>
  );
  return renderHook(() => useChecklistData(), { wrapper });
}

describe('useChecklistData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('o intervalo de auto-refresh é ~30s (FR-008)', () => {
    expect(REFRESH_INTERVAL_MS).toBe(30_000);
  });

  it('começa carregando e depois entrega as rondas com lastUpdatedAt', async () => {
    // Arrange / Act
    const { result } = renderChecklistData(makeService());

    // Assert — estado inicial
    expect(result.current.isLoading).toBe(true);
    expect(result.current.checklists).toEqual([]);
    expect(result.current.lastUpdatedAt).toBeNull();

    // Assert — após resolver
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.checklists).toHaveLength(1);
    expect(result.current.isError).toBe(false);
    expect(result.current.lastUpdatedAt).toBeGreaterThan(0);
  });

  it('expõe o estado de erro quando o service falha', async () => {
    // Arrange
    const service = makeService({ getChecklists: vi.fn(() => Promise.reject(new Error('CDF fora do ar'))) });

    // Act
    const { result } = renderChecklistData(service);

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.checklists).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.lastUpdatedAt).toBeNull();
  });

  it('refresh() dispara uma nova busca no service', async () => {
    // Arrange
    const getChecklists = vi.fn(() => Promise.resolve([makeChecklist()]));
    const { result } = renderChecklistData(makeService({ getChecklists }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getChecklists).toHaveBeenCalledTimes(1);

    // Act
    await act(async () => {
      result.current.refresh();
    });

    // Assert
    await waitFor(() => expect(getChecklists).toHaveBeenCalledTimes(2));
  });
});

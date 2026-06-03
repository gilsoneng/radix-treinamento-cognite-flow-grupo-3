/**
 * Hook de dados das rondas com AUTO-REFRESH (~30s) + refresh manual (FR-008).
 *
 * Camada fina sobre o React Query: a store de cache do RQ é a "camada de storage" (o hook
 * não tem `useState` próprio — CLAUDE.md §5). O service vem por DI (contexto), então o hook
 * é testável sem rede. Erros não são engolidos: ficam expostos em `isError`/`error` para o
 * shell renderizar o estado de erro (FR-012), e o gateway já loga + re-lança.
 */

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo , useContext } from 'react';

import {
  CHECKLISTS_QUERY_KEY,
  ChecklistDataContext,
  REFRESH_INTERVAL_MS,
} from './checklist-data-context';
import type { ChecklistDataSource } from './checklist-data-context';

export function useChecklistData(): ChecklistDataSource {
  const { useCogniteSdk, createService } = useContext(ChecklistDataContext);
  const client = useCogniteSdk();
  const service = useMemo(() => createService(client), [createService, client]);

  const query = useQuery({
    queryKey: CHECKLISTS_QUERY_KEY,
    queryFn: () => service.getChecklists(),
    refetchInterval: REFRESH_INTERVAL_MS,
    // Mantém os dados anteriores em tela durante o polling — sem "piscar" o loader.
    refetchOnWindowFocus: false,
  });

  const { refetch } = query;
  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    checklists: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    isError: query.isError,
    error: query.error,
    // RQ usa 0 para "nunca atualizado"; normalizamos para null.
    lastUpdatedAt: query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null,
    refresh,
  };
}

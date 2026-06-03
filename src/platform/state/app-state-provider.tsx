/**
 * Store ÚNICA do estado host-synced (CLAUDE.md §5: o estado vive aqui, numa camada de
 * storage compartilhada renderizada uma vez na raiz — não dentro de um ViewModel).
 *
 * Responsabilidades:
 *  - SEED a partir de `initialState` do host (sobrevive a reload / link compartilhado).
 *  - Em cada mudança, espelha no host via `api.syncInternalState` (FR-011).
 *
 * A `HostAppAPI` chega por contexto (`useHostAppApi`) — DI, não import direto (CLAUDE.md §3).
 * O push é fire-and-forget com tratamento de erro: a sincronização com a URL nunca deve
 * derrubar a UI nem bloquear a interação do usuário.
 */

import type { HostAppAPI } from '@cognite/app-sdk';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useHostAppApi } from '../host/use-host-app-api';

import { parseAppState, serializeAppState } from './app-state';
import type { AppState } from './app-state';
import { AppStateContext } from './app-state-context';
import type { AppStateContextValue } from './app-state-context';

/** Espelha o estado na URL via host; loga e segue em caso de falha (não quebra a UI). */
function syncToHost(api: HostAppAPI, next: AppState): void {
  api.syncInternalState(serializeAppState(next)).catch((error: unknown) => {
    console.error('Falha ao sincronizar o estado com o host:', error);
  });
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { api, initialState } = useHostAppApi();
  // Seed lazy a partir do host: a URL é a fonte da verdade na primeira renderização.
  const [state, setState] = useState<AppState>(() => parseAppState(initialState));

  const value = useMemo<AppStateContextValue>(() => {
    const commit = (next: AppState) => {
      setState(next);
      syncToHost(api, next);
    };
    return {
      state,
      setActiveView: (activeView) => commit({ ...state, activeView }),
      setFilters: (filters) => commit({ ...state, filters }),
      setSort: (sort) => commit({ ...state, sort }),
      setSearch: (search) => commit({ ...state, search }),
      selectChecklist: (id) => commit({ ...state, selectedChecklistId: id, detailOpen: true }),
      closeDetail: () => commit({ ...state, detailOpen: false }),
      // Trocar a escala limpa a seleção: os bins de 7d/30d/12m têm granularidades diferentes,
      // então um bin selecionado em uma escala não se mapeia em outra.
      setChartScale: (chartScale) => commit({ ...state, chartScale, chartSelection: null }),
      selectChartBin: (chartSelection) => commit({ ...state, chartSelection }),
      clearChartSelection: () => commit({ ...state, chartSelection: null }),
    };
  }, [state, api]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

/**
 * Contrato + injeção de dependências da fonte de dados de Checklists.
 *
 * `useChecklistData` depende DESTE contexto (DI, CLAUDE.md §3), não importa o SDK nem o
 * service direto — assim os testes trocam `createService` por um fake sem rede. As
 * dependências injetadas são as únicas peças "não-stateless": `useCogniteSdk` (cliente
 * autenticado, FR-013) e `createService` (composition root da feature group3).
 */

import { useCogniteSdk } from '@cognite/app-sdk/react';
import type { CogniteClient } from '@cognite/sdk';
import { createContext } from 'react';

import { createGroup3DataService } from '../../services/group3';
import type { Group3DataService } from '../../services/group3';
import type { Checklist } from '../../types/apm';

/** Intervalo do auto-refresh (~30s, FR-008). Polling de "quase tempo real" (SPEC Assumptions). */
export const REFRESH_INTERVAL_MS = 30_000;

/** Chave de cache do React Query para a coleção de rondas. */
export const CHECKLISTS_QUERY_KEY = ['group3', 'checklists'] as const;

/** Visão que o shell e os ViewModels consomem do estado de dados. */
export interface ChecklistDataSource {
  checklists: Checklist[];
  /** `true` só na primeira carga (não durante o polling de fundo). */
  isLoading: boolean;
  /** `true` durante um refetch de fundo (polling ou refresh manual) com dados já em tela. */
  isRefreshing: boolean;
  isError: boolean;
  error: unknown;
  /** Epoch ms da última atualização bem-sucedida; `null` se ainda não houve. */
  lastUpdatedAt: number | null;
  /** Dispara um refetch manual (botão de atualizar). */
  refresh(): void;
}

export interface ChecklistDataDeps {
  useCogniteSdk: () => CogniteClient;
  createService: (client: CogniteClient) => Group3DataService;
}

export const defaultChecklistDataDeps: ChecklistDataDeps = {
  useCogniteSdk,
  createService: createGroup3DataService,
};

export const ChecklistDataContext = createContext<ChecklistDataDeps>(defaultChecklistDataDeps);

/**
 * Injeção de dependência (CLAUDE.md §3) das frentes DEV 1/2 consumidas por DEV 4.
 *
 * Os defaults agora apontam para as implementações reais publicadas em `src/platform` e
 * `src/domain`; testes continuam podendo sobrescrever tudo via `FeatureDepsProvider`.
 * `now` é injetado para manter a classificação determinística.
 */

import { createContext, useContext } from 'react';

import {
  buildChecklistView,
  classifyItemStatus,
  classifyStatus,
  deriveArea,
  derivePriority,
  isOverdue,
} from '../domain';
import { useChecklistData } from '../platform/data/use-checklist-data';
import { useAppState } from '../platform/state/use-app-state';

import type { ItemStatusBucket } from '../domain';
import type { AppStateApi, ChecklistDataSource } from './contracts';
import type { Checklist, ChecklistItem } from '../types/apm';
import type { Priority, StatusBucket } from '../domain';

export interface FeatureDeps {
  useChecklistData: () => ChecklistDataSource;
  useAppState: () => AppStateApi;
  buildChecklistView: typeof buildChecklistView;
  classifyStatus: (checklist: Checklist, now: number) => StatusBucket;
  isOverdue: (checklist: Checklist, now: number) => boolean;
  derivePriority: (checklist: Checklist, now: number) => Priority;
  deriveArea: (checklist: Checklist) => string | null;
  classifyItemStatus: (item: ChecklistItem, now: number) => ItemStatusBucket;
  /** Relógio injetado (epoch ms). */
  now(): number;
}

export const DEFAULT_FEATURE_DEPS: FeatureDeps = {
  useChecklistData,
  useAppState,
  buildChecklistView,
  classifyStatus,
  isOverdue,
  derivePriority,
  deriveArea,
  classifyItemStatus,
  now: () => Date.now(),
};

export const FeatureDepsContext = createContext<FeatureDeps>(DEFAULT_FEATURE_DEPS);

export function useFeatureDeps(): FeatureDeps {
  return useContext(FeatureDepsContext);
}

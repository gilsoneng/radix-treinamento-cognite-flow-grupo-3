/**
 * ViewModel do detalhe da ronda (DEV 4, FR-007/011).
 *
 * Deriva a Checklist selecionada a partir do `selectedChecklistId` (estado host-synced de
 * DEV 1) — abrir um link compartilhado reabre o mesmo detalhe. Stateless (CLAUDE.md §5):
 * seleciona da lista já carregada, classifica itens via domínio e expõe `close()`.
 */

import { useMemo } from 'react';

import { useFeatureDeps } from '../feature-deps';

import type { ItemStatusBucket } from '../../domain';
import type { Checklist } from '../../types/apm';


export interface ChecklistDetailViewModel {
  checklist: Checklist | null;
  itemStatusById: Record<string, ItemStatusBucket>;
  isOpen: boolean;
  close(): void;
}

export function useChecklistDetailViewModel(): ChecklistDetailViewModel {
  const { useChecklistData, useAppState, classifyItemStatus, now } = useFeatureDeps();
  const { checklists, lastUpdatedAt } = useChecklistData();
  const { state, closeDetail } = useAppState();
  const { selectedChecklistId, detailOpen } = state;

  const checklist = useMemo<Checklist | null>(
    () => checklists.find((c) => c.externalId === selectedChecklistId) ?? null,
    [checklists, selectedChecklistId]
  );

  const itemStatusById = useMemo<Record<string, ItemStatusBucket>>(() => {
    if (!checklist) return {};
    const at = lastUpdatedAt ?? now();
    return Object.fromEntries(checklist.items.map((item) => [item.externalId, classifyItemStatus(item, at)]));
  }, [checklist, lastUpdatedAt, now, classifyItemStatus]);

  return {
    checklist,
    itemStatusById,
    isOpen: detailOpen && checklist !== null,
    close: closeDetail,
  };
}

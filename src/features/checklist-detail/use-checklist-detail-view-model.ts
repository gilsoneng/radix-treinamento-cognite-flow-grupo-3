/**
 * ViewModel do detalhe da ronda (FR-007). Deriva a Checklist selecionada (host-synced) a
 * partir do id no estado e pré-monta as linhas de itens (status individual, ativo, medições)
 * para o drawer só renderizar. Seleção/abertura são host-synced (reabrem via link — FR-011).
 */

import { createContext, useContext, useMemo } from 'react';

import { classifyItemStatus, classifyStatus, deriveArea } from '../../domain';
import type { ItemStatusBucket, StatusBucket } from '../../domain';
import { useAppState, useChecklistData } from '../../platform';
import type { ChecklistItem, MeasurementReading } from '../../types/apm';
import { systemClock } from '../shared/clock';
import type { Clock } from '../shared/clock';

const defaultDeps = { useChecklistData, useAppState, now: systemClock as Clock };
export type ChecklistDetailViewModelDeps = typeof defaultDeps;
export const ChecklistDetailViewModelContext = createContext<ChecklistDetailViewModelDeps>(defaultDeps);

export interface ChecklistItemRowView {
  externalId: string;
  title: string;
  statusBucket: ItemStatusBucket;
  assetLabel: string | null;
  measurements: MeasurementReading[];
}

export interface ChecklistDetailViewModel {
  isOpen: boolean;
  title: string;
  statusBucket: StatusBucket | null;
  assignedToLabel: string;
  area: string;
  itemRows: ChecklistItemRowView[];
  close(): void;
}

function toItemRow(item: ChecklistItem, now: number): ChecklistItemRowView {
  return {
    externalId: item.externalId,
    title: item.title ?? '(sem título)',
    statusBucket: classifyItemStatus(item, now),
    assetLabel: item.asset?.title ?? null,
    measurements: item.measurements,
  };
}

const CLOSED: ChecklistDetailViewModel = {
  isOpen: false,
  title: '',
  statusBucket: null,
  assignedToLabel: '—',
  area: '—',
  itemRows: [],
  close: () => undefined,
};

export function useChecklistDetailViewModel(): ChecklistDetailViewModel {
  const { useChecklistData, useAppState, now } = useContext(ChecklistDetailViewModelContext);
  const { checklists } = useChecklistData();
  const { state, closeDetail } = useAppState();
  const { selectedChecklistId, detailOpen } = state;

  return useMemo<ChecklistDetailViewModel>(() => {
    if (!detailOpen || selectedChecklistId === null) {
      return { ...CLOSED, close: closeDetail };
    }
    const checklist = checklists.find((c) => c.externalId === selectedChecklistId);
    if (checklist === undefined) {
      return { ...CLOSED, close: closeDetail };
    }
    const instant = now();
    return {
      isOpen: true,
      title: checklist.title ?? '(sem título)',
      statusBucket: classifyStatus(checklist, instant),
      assignedToLabel: checklist.assignedTo.length > 0 ? checklist.assignedTo.join(', ') : '—',
      area: deriveArea(checklist) ?? '—',
      itemRows: checklist.items.map((item) => toItemRow(item, instant)),
      close: closeDetail,
    };
  }, [checklists, selectedChecklistId, detailOpen, closeDetail, now]);
}

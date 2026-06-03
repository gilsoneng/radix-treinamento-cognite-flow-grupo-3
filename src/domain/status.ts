/**
 * Classificação de status de ronda (Checklist).
 *
 * Valores crus APM (v7): `To Do`, `Ongoing`, `Completed` (+ variantes case-insensitive).
 * Balde `atrasado` sobrescreve o cru quando prazo civil venceu e a ronda não está concluída.
 */

import type { Checklist } from '../types/apm';

import { isPastDeadline } from './deadline';
import type { StatusBucket } from './types';

const CONCLUDED_STATUSES = new Set(['completed', 'done', 'closed']);

function normalizeRawStatus(status: string | null): string {
  return (status ?? '').trim().toLowerCase();
}

/** Ronda considerada concluída pelo status cru da view. */
export function isConcluded(checklist: Checklist): boolean {
  return CONCLUDED_STATUSES.has(normalizeRawStatus(checklist.status));
}

function rawStatusToBucket(raw: string | null): StatusBucket {
  const n = normalizeRawStatus(raw);
  if (n === 'ongoing' || n === 'in progress' || n === 'in_progress') {
    return 'em_andamento';
  }
  if (CONCLUDED_STATUSES.has(n)) {
    return 'concluido';
  }
  return 'aberto';
}

/** Prazo vencido (após fim do dia civil) e ronda não concluída. */
export function isOverdue(checklist: Checklist, now: number): boolean {
  if (isConcluded(checklist)) {
    return false;
  }
  return isPastDeadline(checklist.endTime, now);
}

/**
 * Balde de produto para KPIs, filtros e tabela.
 * Ordem: concluído → atrasado → em_andamento / aberto pelo status cru.
 */
export function classifyStatus(checklist: Checklist, now: number): StatusBucket {
  if (isConcluded(checklist)) {
    return 'concluido';
  }
  if (isOverdue(checklist, now)) {
    return 'atrasado';
  }
  return rawStatusToBucket(checklist.status);
}

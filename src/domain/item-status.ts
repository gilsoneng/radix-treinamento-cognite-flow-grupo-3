import type { ChecklistItem } from '../types/apm';

import { isPastDeadline } from './deadline';

export type ItemStatusBucket = 'ok' | 'not_ok' | 'blocked' | 'pendente' | 'em_andamento' | 'concluido';

const OK_VALUES = new Set(['ok', 'completed', 'done']);
const NOT_OK_VALUES = new Set(['not ok', 'not_ok', 'notok', 'fail', 'failed']);
const BLOCKED_VALUES = new Set(['blocked', 'block']);
const ONGOING_VALUES = new Set(['ongoing', 'in progress', 'in_progress']);

function normalizeItemStatus(status: string | null): string {
  return (status ?? '').trim().toLowerCase();
}

export function classifyItemStatus(item: ChecklistItem, now: number): ItemStatusBucket {
  const n = normalizeItemStatus(item.status);
  if (OK_VALUES.has(n) || n === 'completed') {
    return 'ok';
  }
  if (NOT_OK_VALUES.has(n)) {
    return 'not_ok';
  }
  if (BLOCKED_VALUES.has(n)) {
    return 'blocked';
  }
  if (ONGOING_VALUES.has(n)) {
    return 'em_andamento';
  }
  if (n === 'to do' || n === 'todo' || n === '') {
    if (item.endTime !== null && isPastDeadline(item.endTime, now)) {
      return 'pendente';
    }
    return 'pendente';
  }
  return 'pendente';
}

export function isItemOpen(item: ChecklistItem, now: number): boolean {
  const bucket = classifyItemStatus(item, now);
  return bucket !== 'ok' && bucket !== 'concluido';
}

export function isItemOverdue(item: ChecklistItem, now: number): boolean {
  if (classifyItemStatus(item, now) === 'ok') {
    return false;
  }
  return item.endTime !== null && isPastDeadline(item.endTime, now);
}

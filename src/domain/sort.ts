import type { Checklist } from '../types/apm';

import { parseDeadlineEndOfDay } from './deadline';
import { classifyStatus } from './status';
import type { SortDir, SortKey, StatusBucket } from './types';

const STATUS_ORDER: Record<StatusBucket, number> = {
  atrasado: 0,
  aberto: 1,
  em_andamento: 2,
  concluido: 3,
};

function deadlineSortKey(checklist: Checklist): number {
  if (checklist.endTime === null || checklist.endTime === '') {
    return Number.POSITIVE_INFINITY;
  }
  const end = parseDeadlineEndOfDay(checklist.endTime);
  return Number.isNaN(end) ? Number.POSITIVE_INFINITY : end;
}

function compareNumbers(a: number, b: number, dir: SortDir): number {
  if (a === b) {
    return 0;
  }
  return dir === 'asc' ? a - b : b - a;
}

/** Ordenação estável por prazo ou status (FR-010). */
export function sortChecklists(
  checklists: Checklist[],
  sort: { key: SortKey; dir: SortDir },
  now: number
): Checklist[] {
  const indexed = checklists.map((checklist, index) => ({ checklist, index }));
  indexed.sort((a, b) => {
    let cmp = 0;
    if (sort.key === 'prazo') {
      cmp = compareNumbers(deadlineSortKey(a.checklist), deadlineSortKey(b.checklist), sort.dir);
    } else {
      const sa = STATUS_ORDER[classifyStatus(a.checklist, now)];
      const sb = STATUS_ORDER[classifyStatus(b.checklist, now)];
      cmp = compareNumbers(sa, sb, sort.dir);
    }
    if (cmp !== 0) {
      return cmp;
    }
    return a.index - b.index;
  });
  return indexed.map((entry) => entry.checklist);
}

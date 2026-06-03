import type { Checklist } from '../types/apm';

import { deriveArea } from './area';
import { derivePriority } from './priority';
import { classifyStatus, isOverdue } from './status';
import type { Filters, Period, StatusBucket } from './types';

const PERIOD_MS: Record<Exclude<Period, 'all'>, number> = {
  '7d': 7 * 86_400_000,
  '30d': 30 * 86_400_000,
  '90d': 90 * 86_400_000,
};

function checklistReferenceTime(checklist: Checklist): number {
  if (checklist.startTime !== null && checklist.startTime !== '') {
    const parsed = Date.parse(checklist.startTime);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return checklist.createdTime;
}

/**
 * Janela FR-009: rondas não concluídas sempre entram; concluídas só se referência
 * (`startTime` ou `createdTime`) cai dentro do período.
 */
export function isWithinPeriod(checklist: Checklist, period: Period, now: number): boolean {
  if (period === 'all') {
    return true;
  }
  const bucket = classifyStatus(checklist, now);
  if (bucket !== 'concluido') {
    return true;
  }
  const windowMs = PERIOD_MS[period];
  const ref = checklistReferenceTime(checklist);
  return now - ref <= windowMs;
}

function matchesStatusFilter(bucket: StatusBucket, selected: StatusBucket[]): boolean {
  if (selected.length === 0) {
    return true;
  }
  return selected.includes(bucket);
}

/** Filtros combináveis (status, atrasados, prioridade, área, período). */
export function applyFilters(checklists: Checklist[], filters: Filters, now: number): Checklist[] {
  return checklists.filter((c) => {
    const bucket = classifyStatus(c, now);
    if (!isWithinPeriod(c, filters.period, now)) {
      return false;
    }
    if (!matchesStatusFilter(bucket, filters.status)) {
      return false;
    }
    if (filters.onlyOverdue && !isOverdue(c, now)) {
      return false;
    }
    const priority = derivePriority(c, now);
    if (filters.priority.length > 0 && !filters.priority.includes(priority)) {
      return false;
    }
    const area = deriveArea(c);
    if (filters.area.length > 0) {
      const areaKey = area ?? '';
      if (!filters.area.some((a) => a === areaKey || (area !== null && area.includes(a)))) {
        return false;
      }
    }
    return true;
  });
}

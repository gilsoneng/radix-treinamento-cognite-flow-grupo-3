import type { Checklist } from '../types/apm';

import { deriveArea } from './area';
import { derivePriority } from './priority';
import { slaOnTimePercent } from './sla';
import { classifyStatus, isOverdue } from './status';
import type { ChecklistKpis, Priority, StatusBucket } from './types';
import { EMPTY_PRIORITY_BUCKETS, EMPTY_STATUS_BUCKETS } from './types';

function countByArea(checklists: Checklist[]): { area: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of checklists) {
    const area = deriveArea(c) ?? '(sem área)';
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area, 'pt'));
}

/** KPIs de rondas sobre a lista já filtrada/buscada (FR-006). */
export function computeChecklistKpis(checklists: Checklist[], now: number): ChecklistKpis {
  const byStatus: Record<StatusBucket, number> = { ...EMPTY_STATUS_BUCKETS };
  const byPriority: Record<Priority, number> = { ...EMPTY_PRIORITY_BUCKETS };
  let openCount = 0;
  let overdueCount = 0;

  for (const c of checklists) {
    const bucket = classifyStatus(c, now);
    byStatus[bucket] += 1;
    const priority = derivePriority(c, now);
    byPriority[priority] += 1;
    if (bucket !== 'concluido') {
      openCount += 1;
    }
    if (isOverdue(c, now)) {
      overdueCount += 1;
    }
  }

  return {
    openCount,
    overdueCount,
    slaOnTimePercent: slaOnTimePercent(checklists),
    byStatus,
    byPriority,
    byArea: countByArea(checklists),
  };
}

/** Alias de transição para contrato §6 original. */
export const computeKpis = computeChecklistKpis;

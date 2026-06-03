import type { Checklist } from '../types/apm';

import { classifyItemStatus, isItemOpen, isItemOverdue } from './item-status';
import type { ChecklistItemKpis } from './types';

/** KPIs de tarefas (itens) das rondas já filtradas. */
export function computeChecklistItemKpis(checklists: Checklist[], now: number): ChecklistItemKpis {
  const byItemStatus: Record<string, number> = {};
  let totalItems = 0;
  let openItems = 0;
  let overdueItems = 0;

  for (const checklist of checklists) {
    for (const item of checklist.items) {
      totalItems += 1;
      const bucket = classifyItemStatus(item, now);
      const key = bucket;
      byItemStatus[key] = (byItemStatus[key] ?? 0) + 1;
      if (isItemOpen(item, now)) {
        openItems += 1;
      }
      if (isItemOverdue(item, now)) {
        overdueItems += 1;
      }
    }
  }

  return {
    totalItems,
    openItems,
    overdueItems,
    byItemStatus,
  };
}

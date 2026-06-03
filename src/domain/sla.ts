import type { Checklist } from '../types/apm';

import { parseDeadlineEndOfDay } from './deadline';
import { isConcluded } from './status';

function completedOnTime(checklist: Checklist): boolean {
  if (!isConcluded(checklist)) {
    return false;
  }
  if (checklist.endTime === null || checklist.endTime === '') {
    return true;
  }
  const deadlineEnd = parseDeadlineEndOfDay(checklist.endTime);
  if (Number.isNaN(deadlineEnd)) {
    return true;
  }
  return checklist.lastUpdatedTime <= deadlineEnd;
}

/**
 * Percentual (0–100) de rondas concluídas dentro do prazo civil.
 * Sem rondas concluídas → 100% (nada a penalizar no denominador).
 */
export function slaOnTimePercent(checklists: Checklist[]): number {
  const concluded = checklists.filter(isConcluded);
  if (concluded.length === 0) {
    return 100;
  }
  const onTime = concluded.filter(completedOnTime).length;
  return Math.round((onTime / concluded.length) * 100);
}

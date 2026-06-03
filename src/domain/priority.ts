import type { Checklist } from '../types/apm';

import { classifyStatus } from './status';
import type { Priority } from './types';

const CRITICAL_LABEL_TOKENS = ['oec', 'critical', 'critico', 'crítico'];

function hasCriticalLabel(checklist: Checklist): boolean {
  const labels = [
    ...(checklist.labels ?? []),
    ...(checklist.rootLocation?.labels ?? []),
  ];
  return labels.some((label) => {
    const n = label.trim().toLowerCase();
    return CRITICAL_LABEL_TOKENS.some((token) => n.includes(token));
  });
}

/**
 * Prioridade derivada (Checklist@v7 sem campo nativo):
 * atrasado → alta; labels críticas (ex. OEC) → média; caso contrário → baixa.
 */
export function derivePriority(checklist: Checklist, now: number): Priority {
  const bucket = classifyStatus(checklist, now);
  if (bucket === 'atrasado') {
    return 'alta';
  }
  if (hasCriticalLabel(checklist)) {
    return 'media';
  }
  return 'baixa';
}

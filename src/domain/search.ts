import type { Checklist } from '../types/apm';

import { deriveArea } from './area';

function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function checklistSearchText(checklist: Checklist): string {
  const parts = [
    checklist.title ?? '',
    checklist.description ?? '',
    deriveArea(checklist) ?? '',
    ...(checklist.assignedTo ?? []),
  ];
  for (const item of checklist.items) {
    parts.push(item.title ?? '', item.asset?.title ?? '');
  }
  return normalizeForSearch(parts.join(' '));
}

/** Busca textual por título, descrição, área/ativo e responsáveis (FR-014). */
export function applySearch(checklists: Checklist[], query: string): Checklist[] {
  const trimmed = query.trim();
  if (trimmed === '') {
    return checklists;
  }
  const needle = normalizeForSearch(trimmed);
  return checklists.filter((c) => checklistSearchText(c).includes(needle));
}

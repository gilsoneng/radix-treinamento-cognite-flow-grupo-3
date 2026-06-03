import type { Checklist } from '../types/apm';

/**
 * Área/ativo exibido: `rootLocation.title`, senão primeiro item com `asset.title`.
 */
export function deriveArea(checklist: Checklist): string | null {
  const fromRoot = checklist.rootLocation?.title?.trim();
  if (fromRoot) {
    return fromRoot;
  }
  for (const item of checklist.items) {
    const title = item.asset?.title?.trim();
    if (title) {
      return title;
    }
  }
  return null;
}

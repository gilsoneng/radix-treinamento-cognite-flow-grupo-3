import { buildSampleGraph } from '../../services/group3/__fixtures__/seed';
import { mapChecklists } from '../../services/group3/apm-mapper';
import type { Checklist } from '../../types/apm';

/** Rondas determinísticas do grafo group3 (mapper real, sem SDK). */
export function buildDomainFixtureChecklists(): Checklist[] {
  return mapChecklists(buildSampleGraph());
}

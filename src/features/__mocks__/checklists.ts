import type { AssetSummary, Checklist } from '../../types/apm';

const BASE_TIME = 1_748_908_800_000;

function makeAsset(externalId: string, title: string): AssetSummary {
  return {
    externalId,
    title,
    description: null,
    labels: [],
    source: null,
    sourceId: null,
    parent: null,
    root: null,
    createdTime: BASE_TIME,
    lastUpdatedTime: BASE_TIME,
  };
}

export function makeChecklist(overrides: Partial<Checklist> & Pick<Checklist, 'externalId'>): Checklist {
  const base: Checklist = {
    externalId: overrides.externalId,
    title: 'Ronda padrão',
    description: null,
    status: 'Open',
    type: null,
    assignedTo: ['Operador A'],
    labels: [],
    visibility: null,
    isArchived: false,
    startTime: '2026-05-01T08:00:00Z',
    endTime: '2026-06-15T18:00:00Z',
    sourceId: null,
    source: null,
    rootLocation: makeAsset('asset-area-a', 'Área A'),
    createdBy: null,
    updatedBy: null,
    items: [],
    createdTime: BASE_TIME,
    lastUpdatedTime: BASE_TIME,
  };
  return { ...base, ...overrides };
}

/** Ronda aberta, prazo futuro. */
export const checklistOpen = makeChecklist({
  externalId: 'checklist-open',
  title: 'Ronda aberta',
  status: 'Open',
  endTime: '2026-12-31T18:00:00Z',
  rootLocation: makeAsset('asset-area-a', 'Área A'),
});

/** Ronda atrasada (prazo passado, não concluída). */
export const checklistOverdue = makeChecklist({
  externalId: 'checklist-overdue',
  title: 'Ronda atrasada',
  status: 'In Progress',
  endTime: '2026-01-01T08:00:00Z',
  rootLocation: makeAsset('asset-area-b', 'Área B'),
});

/** Ronda concluída. */
export const checklistCompleted = makeChecklist({
  externalId: 'checklist-completed',
  title: 'Ronda concluída',
  status: 'Done',
  endTime: '2026-05-10T12:00:00Z',
  rootLocation: makeAsset('asset-area-a', 'Área A'),
});

export const sampleChecklists: Checklist[] = [checklistOpen, checklistOverdue, checklistCompleted];

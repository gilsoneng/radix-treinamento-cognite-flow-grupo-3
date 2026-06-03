/**
 * Fábrica reutilizável de `Checklist` de DOMÍNIO (forma normalizada do service) para testes.
 * Defaults coerentes + overrides parciais — evita repetir o objeto inteiro em cada teste.
 */

import type { Checklist } from '../types/apm';

export function makeChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    externalId: 'checklist-1',
    title: 'Ronda turno A',
    description: null,
    status: 'Ready',
    type: 'checklist',
    assignedTo: ['Maria Operadora'],
    labels: [],
    visibility: 'PUBLIC',
    isArchived: false,
    startTime: '2026-06-01T08:00:00.000Z',
    endTime: '2026-06-01T16:00:00.000Z',
    sourceId: null,
    source: null,
    rootLocation: null,
    createdBy: null,
    updatedBy: null,
    items: [],
    createdTime: 1717228800000,
    lastUpdatedTime: 1717228800000,
    ...overrides,
  };
}

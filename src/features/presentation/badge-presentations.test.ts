import { describe, expect, it } from 'vitest';

import type { ItemStatusBucket, Priority, StatusBucket } from '../../domain/types';
import { PRIORITIES, STATUS_BUCKETS } from '../../domain/types';

import {
  CHECKLIST_STATUS_PRESENTATION,
  ITEM_STATUS_PRESENTATION,
  PRIORITY_PRESENTATION,
  isItemStatusBucket,
} from './badge-presentations';

describe('badge-presentations', () => {
  it('define label e variant para cada status de ronda', () => {
    for (const bucket of STATUS_BUCKETS) {
      const presentation = CHECKLIST_STATUS_PRESENTATION[bucket as StatusBucket];
      expect(presentation.label.length).toBeGreaterThan(0);
      expect(presentation.variant).toBeTruthy();
    }
  });

  it('define label e variant para cada prioridade', () => {
    for (const bucket of PRIORITIES) {
      const presentation = PRIORITY_PRESENTATION[bucket as Priority];
      expect(presentation.label.length).toBeGreaterThan(0);
      expect(presentation.variant).toBeTruthy();
    }
  });

  it('define label e variant para cada status de tarefa', () => {
    for (const bucket of Object.keys(ITEM_STATUS_PRESENTATION) as ItemStatusBucket[]) {
      const presentation = ITEM_STATUS_PRESENTATION[bucket];
      expect(presentation.label.length).toBeGreaterThan(0);
      expect(presentation.variant).toBeTruthy();
    }
  });

  it('isItemStatusBucket reconhece apenas baldes válidos', () => {
    expect(isItemStatusBucket('ok')).toBe(true);
    expect(isItemStatusBucket('pendente')).toBe(true);
    expect(isItemStatusBucket('unknown')).toBe(false);
  });
});

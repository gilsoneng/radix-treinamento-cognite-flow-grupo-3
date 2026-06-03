import { describe, expect, it } from 'vitest';

import type { Checklist } from '../types/apm';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { parseDeadlineEndOfDay } from './deadline';
import { classifyStatus, isConcluded, isOverdue } from './status';

function makeChecklist(overrides: Partial<Checklist>): Checklist {
  const base = buildDomainFixtureChecklists()[1];
  return { ...base, ...overrides };
}

describe(classifyStatus.name, () => {
  const fixtures = buildDomainFixtureChecklists();

  it('should classify Completed checklist as concluido', () => {
    const completed = fixtures.find((c) => c.externalId === 'checklist-a');
    expect(completed).toBeDefined();
    expect(classifyStatus(completed!, 0)).toBe('concluido');
  });

  it('should classify To Do as aberto when not past deadline', () => {
    const todo = fixtures.find((c) => c.externalId === 'checklist-b');
    expect(classifyStatus(todo!, Date.parse('2020-01-01T00:00:00.000Z'))).toBe('aberto');
  });

  it('should classify non-concluded past deadline as atrasado', () => {
    const overdue = makeChecklist({
      status: 'To Do',
      endTime: '2020-01-01T12:00:00.000Z',
    });
    const now = parseDeadlineEndOfDay('2020-01-01T12:00:00.000Z') + 1;
    expect(classifyStatus(overdue, now)).toBe('atrasado');
  });

  it('should not mark Completed as atrasado even if endTime is in the past', () => {
    const done = makeChecklist({
      status: 'Completed',
      endTime: '2020-01-01T12:00:00.000Z',
    });
    const now = Date.parse('2030-01-01T00:00:00.000Z');
    expect(classifyStatus(done, now)).toBe('concluido');
    expect(isOverdue(done, now)).toBe(false);
  });
});

describe(isConcluded.name, () => {
  it('should treat Completed as concluded', () => {
    expect(isConcluded(makeChecklist({ status: 'Completed' }))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import type { Checklist } from '../types/apm';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { deriveArea } from './area';

describe(deriveArea.name, () => {
  it('should prefer rootLocation title', () => {
    const [first] = buildDomainFixtureChecklists();
    expect(deriveArea(first)).toBe('Route Root');
  });

  it('should fall back to first item asset title', () => {
    const checklist: Checklist = {
      ...buildDomainFixtureChecklists()[0],
      rootLocation: null,
    };
    expect(deriveArea(checklist)).toBe('Diffuser Scraper');
  });

  it('should return null when no area source', () => {
    const checklist: Checklist = {
      ...buildDomainFixtureChecklists()[0],
      rootLocation: null,
      items: [],
    };
    expect(deriveArea(checklist)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import { resultLabel } from './chart-style';

describe('resultLabel', () => {
  it('rotula as séries clicáveis', () => {
    expect(resultLabel('ok')).toBe('OK');
    expect(resultLabel('not_ok')).toBe('Not Ok');
  });
});

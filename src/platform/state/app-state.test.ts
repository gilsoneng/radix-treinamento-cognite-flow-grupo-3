import { describe, expect, it } from 'vitest';

import { DEFAULT_STATE, parseAppState, serializeAppState } from './app-state';
import type { AppState } from './app-state';

describe('parseAppState', () => {
  it('retorna o estado padrão quando a entrada é undefined ou vazia', () => {
    expect(parseAppState(undefined)).toEqual(DEFAULT_STATE);
    expect(parseAppState('')).toEqual(DEFAULT_STATE);
  });

  it('retorna o estado padrão quando o JSON é inválido', () => {
    expect(parseAppState('{ not json')).toEqual(DEFAULT_STATE);
  });

  it('retorna o estado padrão quando o JSON não é um objeto', () => {
    expect(parseAppState('42')).toEqual(DEFAULT_STATE);
    expect(parseAppState('"texto"')).toEqual(DEFAULT_STATE);
    expect(parseAppState('[1,2,3]')).toEqual(DEFAULT_STATE);
  });

  it('reidrata um estado completo e válido (round-trip)', () => {
    // Arrange
    const state: AppState = {
      activeView: 'list',
      filters: { status: ['atrasado'], onlyOverdue: true, priority: ['alta'], area: ['Área 1'], period: '90d' },
      sort: { key: 'status', dir: 'desc' },
      search: 'bomba',
      selectedChecklistId: 'checklist-7',
      detailOpen: true,
      chartScale: '12m',
      chartSelection: { scale: '12m', binStart: 1_700_000_000_000, binEnd: 1_702_000_000_000, result: 'not_ok', binLabel: 'mai/26' },
    };

    // Act
    const restored = parseAppState(serializeAppState(state));

    // Assert
    expect(restored).toEqual(state);
  });

  it('faz seed dos campos de gráfico no default quando ausentes (links antigos)', () => {
    const parsed = parseAppState(JSON.stringify({ activeView: 'list' }));
    expect(parsed.chartScale).toBe('30d');
    expect(parsed.chartSelection).toBeNull();
  });

  it('descarta uma chartSelection inválida (cai para null sem quebrar)', () => {
    const raw = JSON.stringify({
      chartScale: 'decada', // inválida → default
      chartSelection: { scale: '7d', binStart: 'x', binEnd: 10, result: 'talvez', binLabel: 5 },
    });
    const parsed = parseAppState(raw);
    expect(parsed.chartScale).toBe('30d');
    expect(parsed.chartSelection).toBeNull();
  });

  it('aceita uma chartSelection válida e normaliza binLabel ausente', () => {
    const raw = JSON.stringify({
      chartScale: '7d',
      chartSelection: { scale: '7d', binStart: 1, binEnd: 2, result: 'ok' },
    });
    const parsed = parseAppState(raw);
    expect(parsed.chartScale).toBe('7d');
    expect(parsed.chartSelection).toEqual({ scale: '7d', binStart: 1, binEnd: 2, result: 'ok', binLabel: '' });
  });

  it('cai no default por campo quando valores são inválidos (tolerante a links antigos)', () => {
    // Arrange — activeView inválida, filtros com lixo, sort inválido
    const raw = JSON.stringify({
      activeView: 'galaxy',
      filters: { status: ['atrasado', 'inexistente'], onlyOverdue: 'sim', priority: 'alta', area: [1, 'Área 2'], period: 'ontem' },
      sort: { key: 'cor', dir: 'cima' },
      search: 123,
      selectedChecklistId: 99,
      detailOpen: 'talvez',
    });

    // Act
    const parsed = parseAppState(raw);

    // Assert — só os valores válidos sobrevivem; o resto vira default
    expect(parsed.activeView).toBe('dashboard');
    expect(parsed.filters.status).toEqual(['atrasado']); // 'inexistente' descartado
    expect(parsed.filters.onlyOverdue).toBe(false);
    expect(parsed.filters.priority).toEqual([]); // string não-array descartada
    expect(parsed.filters.area).toEqual(['Área 2']); // número descartado
    expect(parsed.filters.period).toBe('30d');
    expect(parsed.sort).toEqual({ key: 'prazo', dir: 'asc' });
    expect(parsed.search).toBe('');
    expect(parsed.selectedChecklistId).toBeNull();
    expect(parsed.detailOpen).toBe(false);
  });
});

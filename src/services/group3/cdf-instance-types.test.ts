import type { NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it } from 'vitest';

import { makeSdkEdge, makeSdkNode } from './__fixtures__/seed';
import {
  asBoolean,
  asInstanceRef,
  asMeasurementOptions,
  asNumber,
  asString,
  asStringArray,
  isEdgeDefinition,
  isNodeDefinition,
  viewProperties,
} from './cdf-instance-types';
import { VIEW_CHECKLIST , EDGE_REFERENCE_CHECKLIST_ITEMS } from './model-ids';


describe('cdf-instance-types — guards de instância', () => {
  it('isNodeDefinition / isEdgeDefinition discriminam node e edge', () => {
    const node: NodeOrEdge = makeSdkNode(VIEW_CHECKLIST, 'c1', {});
    const edge: NodeOrEdge = makeSdkEdge(EDGE_REFERENCE_CHECKLIST_ITEMS, 'e1', 'c1', 'i1');

    expect(isNodeDefinition(node)).toBe(true);
    expect(isNodeDefinition(edge)).toBe(false);
    expect(isEdgeDefinition(edge)).toBe(true);
    expect(isEdgeDefinition(node)).toBe(false);
  });
});

describe('cdf-instance-types — viewProperties', () => {
  it('extrai o bag da view e retorna {} quando ausente', () => {
    const node = makeSdkNode(VIEW_CHECKLIST, 'c1', { title: 'Ronda' });
    expect(viewProperties(node, VIEW_CHECKLIST)).toEqual({ title: 'Ronda' });

    const empty = makeSdkNode(VIEW_CHECKLIST, 'c2', {});
    // Node de uma view diferente da pedida → bag vazio.
    expect(viewProperties(empty, { type: 'view', space: 'x', externalId: 'Y', version: 'v1' })).toEqual({});
  });
});

describe('cdf-instance-types — readers', () => {
  it('asString aceita só string', () => {
    expect(asString('x')).toBe('x');
    expect(asString(1)).toBeNull();
    expect(asString(undefined)).toBeNull();
  });

  it('asNumber aceita só número finito', () => {
    expect(asNumber(170)).toBe(170);
    expect(asNumber(Number.NaN)).toBeNull();
    expect(asNumber('170')).toBeNull();
  });

  it('asBoolean aceita só boolean', () => {
    expect(asBoolean(false)).toBe(false);
    expect(asBoolean('false')).toBeNull();
  });

  it('asStringArray filtra não-strings e devolve [] quando ausente', () => {
    expect(asStringArray(['a', 1, 'b', null])).toEqual(['a', 'b']);
    expect(asStringArray('nope')).toEqual([]);
  });

  it('asInstanceRef exige space + externalId string', () => {
    expect(asInstanceRef({ space: 's', externalId: 'e' })).toEqual({ space: 's', externalId: 'e' });
    expect(asInstanceRef({ space: 's' })).toBeNull();
    expect(asInstanceRef(null)).toBeNull();
  });

  it('asMeasurementOptions só aceita {label,value} e null quando não-lista', () => {
    expect(
      asMeasurementOptions([
        { label: 'OK', value: 'OK' },
        { label: 'bad' },
        'x',
      ])
    ).toEqual([{ label: 'OK', value: 'OK' }]);
    expect(asMeasurementOptions(null)).toBeNull();
  });
});

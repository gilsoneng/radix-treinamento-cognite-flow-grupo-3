/**
 * Adaptação tipada à API de instâncias do `@cognite/sdk` (DMS v3).
 *
 * - Tipos de request/response derivados do próprio client (`Parameters`/`ReturnType`),
 *   evitando `as` e mantendo sincronia automática com a versão instalada do SDK (§7).
 * - Type guards para estreitar `NodeOrEdge` em node/edge.
 * - Leitores de propriedade PUROS, baseados em guards, para extrair valores do bag
 *   opaco `Record<string, unknown>` sem `any` e sem `as`.
 */

import type { CogniteClient, EdgeDefinition, NodeDefinition, NodeOrEdge, ViewReference } from '@cognite/sdk';

import type { InstanceRef, MeasurementOption } from '../../types/apm';

import { viewPropertyKey } from './model-ids';

/** Forma exata do argumento aceito por `client.instances.list(...)`. */
export type InstancesListRequest = Parameters<CogniteClient['instances']['list']>[0];

/** Forma exata da resposta de `client.instances.list(...)` (inclui `items` + `nextCursor`). */
export type InstancesListResponse = Awaited<ReturnType<CogniteClient['instances']['list']>>;

/** Bag opaco de propriedades de uma view (valores ainda não validados). */
export type PropertyBag = Record<string, unknown>;

export function isNodeDefinition(item: NodeOrEdge): item is NodeDefinition {
  return item.instanceType === 'node';
}

export function isEdgeDefinition(item: NodeOrEdge): item is EdgeDefinition {
  return item.instanceType === 'edge';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extrai o bag de propriedades de uma view específica de um node.
 * `node.properties` tem a forma `{ [viewSpace]: { [`${externalId}/${version}`]: {...} } }`.
 */
export function viewProperties(node: NodeDefinition, view: ViewReference): PropertyBag {
  const bySpace = node.properties?.[view.space];
  const bag = bySpace?.[viewPropertyKey(view)];
  return isRecord(bag) ? bag : {};
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/** Array de strings; ignora elementos não-string. Retorna `[]` quando ausente. */
export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Direct relation `{ space, externalId }` → `InstanceRef`, ou `null`. */
export function asInstanceRef(value: unknown): InstanceRef | null {
  if (!isRecord(value)) return null;
  const { space, externalId } = value;
  return typeof space === 'string' && typeof externalId === 'string' ? { space, externalId } : null;
}

/** Lista de opções `{ label, value }` (medições `checkbox`); `null` se não for lista. */
export function asMeasurementOptions(value: unknown): MeasurementOption[] | null {
  if (!Array.isArray(value)) return null;
  const options: MeasurementOption[] = [];
  for (const item of value) {
    if (isRecord(item) && typeof item.label === 'string' && typeof item.value === 'string') {
      options.push({ label: item.label, value: item.value });
    }
  }
  return options;
}

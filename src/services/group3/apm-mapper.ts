/**
 * Mapper PURO: instâncias DMS cruas (nodes/edges do SDK) → entidades de domínio APM
 * normalizadas. Sem IO, sem SDK client — só transformação. Responsabilidade única.
 *
 * Resolução de relações:
 *  - `referenceChecklistItems` (Checklist→ChecklistItem) aninha `items` na Checklist.
 *  - `referenceMeasurements`  (ChecklistItem→MeasurementReading) aninha `measurements`.
 *  - direct relations `asset`/`rootLocation`/`createdBy`/`updatedBy` resolvidas via
 *    índices `externalId → entidade` (todas as instâncias vivem no mesmo space).
 */

import type { EdgeDefinition, NodeDefinition } from '@cognite/sdk';

import type { AssetSummary, CdfUser, Checklist, ChecklistItem, MeasurementReading } from '../../types/apm';

import {
  asBoolean,
  asInstanceRef,
  asMeasurementOptions,
  asNumber,
  asString,
  asStringArray,
  viewProperties,
} from './cdf-instance-types';
import {
  VIEW_ASSET,
  VIEW_CDF_USER,
  VIEW_CHECKLIST,
  VIEW_CHECKLIST_ITEM,
  VIEW_MEASUREMENT_READING,
} from './model-ids';

/** Conjunto cru de instâncias do space, separado por view/edge type. */
export interface RawApmGraph {
  checklists: NodeDefinition[];
  checklistItems: NodeDefinition[];
  measurements: NodeDefinition[];
  assets: NodeDefinition[];
  users: NodeDefinition[];
  /** Edges `cdf_apm:referenceChecklistItems`. */
  checklistItemEdges: EdgeDefinition[];
  /** Edges `cdf_apm:referenceMeasurements`. */
  measurementEdges: EdgeDefinition[];
}

/** Subconjunto necessário para montar ChecklistItems normalizados. */
export type ChecklistItemGraph = Pick<
  RawApmGraph,
  'checklistItems' | 'measurements' | 'assets' | 'users' | 'measurementEdges'
>;

export function mapUsers(nodes: NodeDefinition[]): CdfUser[] {
  return nodes.map(toCdfUser);
}

export function mapAssets(nodes: NodeDefinition[]): AssetSummary[] {
  return nodes.map(toAssetSummary);
}

export function mapMeasurementReadings(nodes: NodeDefinition[]): MeasurementReading[] {
  return nodes.map(toMeasurementReading);
}

export function mapChecklistItems(graph: ChecklistItemGraph): ChecklistItem[] {
  const assetsById = indexByExternalId(mapAssets(graph.assets));
  const usersById = indexByExternalId(mapUsers(graph.users));
  const measurementsById = indexByExternalId(mapMeasurementReadings(graph.measurements));
  const measurementIdsByItemId = groupEndsByStart(graph.measurementEdges);

  return graph.checklistItems.map((node) =>
    toChecklistItem(node, { assetsById, usersById, measurementsById, measurementIdsByItemId })
  );
}

export function mapChecklists(graph: RawApmGraph): Checklist[] {
  const items = mapChecklistItems(graph);
  const itemsById = indexByExternalId(items);
  const assetsById = indexByExternalId(mapAssets(graph.assets));
  const usersById = indexByExternalId(mapUsers(graph.users));
  const itemIdsByChecklistId = groupEndsByStart(graph.checklistItemEdges);

  return graph.checklists.map((node) =>
    toChecklist(node, { assetsById, usersById, itemsById, itemIdsByChecklistId })
  );
}

// ----------------------------- leaf mappers -----------------------------

function toCdfUser(node: NodeDefinition): CdfUser {
  const p = viewProperties(node, VIEW_CDF_USER);
  return {
    externalId: node.externalId,
    name: asString(p.name),
    email: asString(p.email),
    createdTime: node.createdTime,
    lastUpdatedTime: node.lastUpdatedTime,
  };
}

function toAssetSummary(node: NodeDefinition): AssetSummary {
  const p = viewProperties(node, VIEW_ASSET);
  return {
    externalId: node.externalId,
    title: asString(p.title),
    description: asString(p.description),
    labels: asStringArray(p.labels),
    source: asString(p.source),
    sourceId: asString(p.sourceId),
    parent: asInstanceRef(p.parent),
    root: asInstanceRef(p.root),
    createdTime: node.createdTime,
    lastUpdatedTime: node.lastUpdatedTime,
  };
}

function toMeasurementReading(node: NodeDefinition): MeasurementReading {
  const p = viewProperties(node, VIEW_MEASUREMENT_READING);
  return {
    externalId: node.externalId,
    title: asString(p.title),
    type: asString(p.type),
    description: asString(p.description),
    labels: asStringArray(p.labels),
    options: asMeasurementOptions(p.options),
    min: asNumber(p.min),
    max: asNumber(p.max),
    visibility: asString(p.visibility),
    isArchived: asBoolean(p.isArchived),
    createdTime: node.createdTime,
    lastUpdatedTime: node.lastUpdatedTime,
  };
}

interface ChecklistItemContext {
  assetsById: Map<string, AssetSummary>;
  usersById: Map<string, CdfUser>;
  measurementsById: Map<string, MeasurementReading>;
  measurementIdsByItemId: Map<string, string[]>;
}

function toChecklistItem(node: NodeDefinition, ctx: ChecklistItemContext): ChecklistItem {
  const p = viewProperties(node, VIEW_CHECKLIST_ITEM);
  const measurementIds = ctx.measurementIdsByItemId.get(node.externalId) ?? [];
  return {
    externalId: node.externalId,
    title: asString(p.title),
    description: asString(p.description),
    status: asString(p.status),
    order: asNumber(p.order),
    note: asString(p.note),
    labels: asStringArray(p.labels),
    visibility: asString(p.visibility),
    isArchived: asBoolean(p.isArchived),
    startTime: asString(p.startTime),
    endTime: asString(p.endTime),
    sourceId: asString(p.sourceId),
    source: asString(p.source),
    asset: resolveRef(p.asset, ctx.assetsById),
    createdBy: resolveRef(p.createdBy, ctx.usersById),
    updatedBy: resolveRef(p.updatedBy, ctx.usersById),
    measurements: resolveMany(measurementIds, ctx.measurementsById),
    createdTime: node.createdTime,
    lastUpdatedTime: node.lastUpdatedTime,
  };
}

interface ChecklistContext {
  assetsById: Map<string, AssetSummary>;
  usersById: Map<string, CdfUser>;
  itemsById: Map<string, ChecklistItem>;
  itemIdsByChecklistId: Map<string, string[]>;
}

function toChecklist(node: NodeDefinition, ctx: ChecklistContext): Checklist {
  const p = viewProperties(node, VIEW_CHECKLIST);
  const itemIds = ctx.itemIdsByChecklistId.get(node.externalId) ?? [];
  return {
    externalId: node.externalId,
    title: asString(p.title),
    description: asString(p.description),
    status: asString(p.status),
    type: asString(p.type),
    assignedTo: asStringArray(p.assignedTo),
    labels: asStringArray(p.labels),
    visibility: asString(p.visibility),
    isArchived: asBoolean(p.isArchived),
    startTime: asString(p.startTime),
    endTime: asString(p.endTime),
    sourceId: asString(p.sourceId),
    source: asString(p.source),
    rootLocation: resolveRef(p.rootLocation, ctx.assetsById),
    createdBy: resolveRef(p.createdBy, ctx.usersById),
    updatedBy: resolveRef(p.updatedBy, ctx.usersById),
    items: resolveMany(itemIds, ctx.itemsById),
    createdTime: node.createdTime,
    lastUpdatedTime: node.lastUpdatedTime,
  };
}

// ------------------------------- helpers --------------------------------

function indexByExternalId<T extends { externalId: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.externalId, item);
  }
  return map;
}

/** Agrupa `endNode.externalId` por `startNode.externalId` (preserva a ordem das edges). */
function groupEndsByStart(edges: EdgeDefinition[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    const start = edge.startNode.externalId;
    const ends = map.get(start);
    if (ends) {
      ends.push(edge.endNode.externalId);
    } else {
      map.set(start, [edge.endNode.externalId]);
    }
  }
  return map;
}

/** Resolve uma direct relation crua para a entidade indexada (ou `null`). */
function resolveRef<T>(rawRef: unknown, byId: Map<string, T>): T | null {
  const ref = asInstanceRef(rawRef);
  if (!ref) return null;
  return byId.get(ref.externalId) ?? null;
}

/** Resolve uma lista de externalIds para entidades existentes (descarta ausentes). */
function resolveMany<T>(externalIds: string[], byId: Map<string, T>): T[] {
  const resolved: T[] = [];
  for (const externalId of externalIds) {
    const entity = byId.get(externalId);
    if (entity !== undefined) {
      resolved.push(entity);
    }
  }
  return resolved;
}

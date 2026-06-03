/**
 * Fixtures de teste para a feature group3.
 *
 *  - `buildSampleGraph()` — grafo SDK-shaped pequeno e controlado, cobrindo todos os
 *    tipos de node/edge, resolução de refs e o caso de item SEM medição.
 *  - `loadSeedRawGraph()` — carrega o seed JSON REAL (forma "bundle") e o converte para
 *    a forma do SDK, permitindo provar o mapper contra os dados de produção (8/193/...).
 *  - `makeSdkNode`/`makeSdkEdge` — builders reutilizados também nos testes do gateway.
 *
 * Sem `any` e sem `as`: os valores crus do JSON são coagidos via guards para o tipo
 * derivado das próprias declarações do SDK.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { EdgeDefinition, NodeDefinition, ViewReference } from '@cognite/sdk';

import type { RawApmGraph } from '../apm-mapper';
import type { EdgeTypeRef } from '../model-ids';
import {
  EDGE_REFERENCE_CHECKLIST_ITEMS,
  EDGE_REFERENCE_MEASUREMENTS,
  INSTANCE_SPACE,
  VIEW_ASSET,
  VIEW_CDF_USER,
  VIEW_CHECKLIST,
  VIEW_CHECKLIST_ITEM,
  VIEW_MEASUREMENT_READING,
  viewPropertyKey,
} from '../model-ids';

/**
 * Valor primitivo aceito como propriedade de uma view (derivado das declarações do SDK):
 * `properties` → ViewOrContainer → PropertyValueGroupV3 → RawPropertyValueV3.
 */
type RawValue = NonNullable<NodeDefinition['properties']>[string][string][string];

/** Data de referência determinística do seed (epoch ms), usada como created/lastUpdated. */
export const SEED_TIME = 1_748_908_800_000;

export function makeSdkNode(
  view: ViewReference,
  externalId: string,
  properties: Record<string, RawValue>
): NodeDefinition {
  return {
    instanceType: 'node',
    externalId,
    space: INSTANCE_SPACE,
    version: 1,
    createdTime: SEED_TIME,
    lastUpdatedTime: SEED_TIME,
    properties: { [view.space]: { [viewPropertyKey(view)]: properties } },
  };
}

export function makeSdkEdge(
  edgeType: EdgeTypeRef,
  externalId: string,
  startExternalId: string,
  endExternalId: string
): EdgeDefinition {
  return {
    instanceType: 'edge',
    externalId,
    space: INSTANCE_SPACE,
    version: 1,
    createdTime: SEED_TIME,
    lastUpdatedTime: SEED_TIME,
    type: { space: edgeType.space, externalId: edgeType.externalId },
    startNode: { space: INSTANCE_SPACE, externalId: startExternalId },
    endNode: { space: INSTANCE_SPACE, externalId: endExternalId },
  };
}

const REF = (externalId: string): RawValue => ({ space: INSTANCE_SPACE, externalId });

/**
 * Grafo controlado: 2 usuários, 2 assets (root + equipamento), 2 medições
 * (checkbox + numérica), 3 itens (2 na checklist A, 1 na B; o item-3 sem medição)
 * e 2 checklists.
 */
export function buildSampleGraph(): RawApmGraph {
  const users = [
    makeSdkNode(VIEW_CDF_USER, 'user-supervisor', { name: 'Pat Supervisor', email: 'pat.supervisor@plant.test' }),
    makeSdkNode(VIEW_CDF_USER, 'user-operator', { name: 'Alex Operator', email: 'alex.operator@plant.test' }),
  ];

  const assets = [
    makeSdkNode(VIEW_ASSET, 'asset-root', {
      title: 'Route Root',
      description: 'Route One root',
      labels: ['OEC', 'Route Root'],
      source: 'Route 1',
    }),
    makeSdkNode(VIEW_ASSET, 'asset-equip', {
      title: 'Diffuser Scraper',
      description: 'Diffuser Scraper | 7th Floor',
      labels: ['7th Floor', 'OEC'],
      source: 'Route 1',
      sourceId: '301112080',
      parent: REF('asset-root'),
      root: REF('asset-root'),
    }),
  ];

  const measurements = [
    makeSdkNode(VIEW_MEASUREMENT_READING, 'm-checkbox', {
      title: 'OK / Not OK',
      type: 'checkbox',
      labels: ['OEC'],
      options: [
        { label: 'OK', value: 'OK' },
        { label: 'Not OK', value: 'Not OK' },
      ],
      visibility: 'PUBLIC',
      isArchived: false,
    }),
    makeSdkNode(VIEW_MEASUREMENT_READING, 'm-numerical', {
      title: 'Temperature (°F)',
      type: 'numerical',
      labels: ['OEC'],
      max: 170,
      visibility: 'PUBLIC',
      isArchived: false,
    }),
  ];

  const checklistItems = [
    makeSdkNode(VIEW_CHECKLIST_ITEM, 'item-1', {
      title: 'General Condition',
      status: 'Completed',
      order: 1,
      note: '',
      labels: ['7th Floor'],
      visibility: 'PUBLIC',
      isArchived: false,
      startTime: '2026-04-24T12:00:00.000Z',
      endTime: '2026-05-01T12:00:00.000Z',
      sourceId: 'LIN-49',
      source: 'Diffuser Scraper',
      asset: REF('asset-equip'),
      createdBy: REF('user-supervisor'),
      updatedBy: REF('user-operator'),
    }),
    makeSdkNode(VIEW_CHECKLIST_ITEM, 'item-2', {
      title: 'Temperature',
      status: 'Ongoing',
      order: 2,
      asset: REF('asset-equip'),
      createdBy: REF('user-operator'),
    }),
    // item-3 propositalmente SEM edge de medição (cobre o caso 192 medições vs 193 itens).
    makeSdkNode(VIEW_CHECKLIST_ITEM, 'item-3', {
      title: 'No. of Open Nozzles',
      status: 'To Do',
      order: 1,
    }),
  ];

  const checklists = [
    makeSdkNode(VIEW_CHECKLIST, 'checklist-a', {
      title: '7th Floor',
      description: 'Route One — 7th Floor',
      status: 'Completed',
      type: 'OEC Route',
      assignedTo: ['Alex Morgan', 'Jordan Lee'],
      labels: ['7th Floor'],
      visibility: 'PUBLIC',
      isArchived: false,
      startTime: '2026-04-24T12:00:00.000Z',
      endTime: '2026-05-01T12:00:00.000Z',
      sourceId: 'SRC-7th Floor',
      source: '7th Floor',
      rootLocation: REF('asset-root'),
      createdBy: REF('user-supervisor'),
      updatedBy: REF('user-operator'),
    }),
    makeSdkNode(VIEW_CHECKLIST, 'checklist-b', {
      title: 'Ground Floor',
      status: 'To Do',
      type: 'OEC Route',
      assignedTo: ['Sam Lead'],
    }),
  ];

  const checklistItemEdges = [
    makeSdkEdge(EDGE_REFERENCE_CHECKLIST_ITEMS, 'rci-a-1', 'checklist-a', 'item-1'),
    makeSdkEdge(EDGE_REFERENCE_CHECKLIST_ITEMS, 'rci-a-2', 'checklist-a', 'item-2'),
    makeSdkEdge(EDGE_REFERENCE_CHECKLIST_ITEMS, 'rci-b-3', 'checklist-b', 'item-3'),
  ];

  const measurementEdges = [
    makeSdkEdge(EDGE_REFERENCE_MEASUREMENTS, 'rms-1', 'item-1', 'm-checkbox'),
    makeSdkEdge(EDGE_REFERENCE_MEASUREMENTS, 'rms-2', 'item-2', 'm-numerical'),
  ];

  return { checklists, checklistItems, measurements, assets, users, checklistItemEdges, measurementEdges };
}

// ----------------- carregamento do seed JSON real (forma "bundle") -----------------

/** Caminho do seed real, relativo à raiz do projeto (onde o Vitest executa). */
const SEED_JSON_RELATIVE_PATH = 'seed/app_seed/data/apm-app-data-route-1-seed.json';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function coerceRaw(value: unknown): RawValue | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) return value;
  return undefined;
}

function toPropertyGroup(props: Record<string, unknown>): Record<string, RawValue> {
  const out: Record<string, RawValue> = {};
  for (const [key, value] of Object.entries(props)) {
    const coerced = coerceRaw(value);
    if (coerced !== undefined) out[key] = coerced;
  }
  return out;
}

function asRef(value: unknown): { space: string; externalId: string } | null {
  if (!isRecord(value)) return null;
  const { space, externalId } = value;
  return typeof space === 'string' && typeof externalId === 'string' ? { space, externalId } : null;
}

function bundleViewExternalId(raw: unknown): string | null {
  if (!isRecord(raw) || !Array.isArray(raw.sources)) return null;
  const first = raw.sources[0];
  if (!isRecord(first) || !isRecord(first.source)) return null;
  const externalId = first.source.externalId;
  return typeof externalId === 'string' ? externalId : null;
}

function bundleNodeToSdk(raw: unknown): NodeDefinition | null {
  if (!isRecord(raw) || !Array.isArray(raw.sources)) return null;
  const { externalId, space } = raw;
  if (typeof externalId !== 'string' || typeof space !== 'string') return null;
  const first = raw.sources[0];
  if (!isRecord(first) || !isRecord(first.source) || !isRecord(first.properties)) return null;
  const view = first.source;
  if (typeof view.space !== 'string' || typeof view.externalId !== 'string' || typeof view.version !== 'string') {
    return null;
  }
  return {
    instanceType: 'node',
    externalId,
    space,
    version: 1,
    createdTime: SEED_TIME,
    lastUpdatedTime: SEED_TIME,
    properties: { [view.space]: { [`${view.externalId}/${view.version}`]: toPropertyGroup(first.properties) } },
  };
}

function bundleEdgeTypeExternalId(raw: unknown): string | null {
  if (!isRecord(raw) || !isRecord(raw.type)) return null;
  const externalId = raw.type.externalId;
  return typeof externalId === 'string' ? externalId : null;
}

function bundleEdgeToSdk(raw: unknown): EdgeDefinition | null {
  if (!isRecord(raw)) return null;
  const { externalId, space } = raw;
  if (typeof externalId !== 'string' || typeof space !== 'string') return null;
  const type = asRef(raw.type);
  const startNode = asRef(raw.startNode);
  const endNode = asRef(raw.endNode);
  if (!type || !startNode || !endNode) return null;
  return {
    instanceType: 'edge',
    externalId,
    space,
    version: 1,
    createdTime: SEED_TIME,
    lastUpdatedTime: SEED_TIME,
    type,
    startNode,
    endNode,
  };
}

/** Lê o seed JSON real e o converte para `RawApmGraph` (forma do SDK), por view/edge type. */
export function loadSeedRawGraph(): RawApmGraph {
  const seedPath = resolve(process.cwd(), SEED_JSON_RELATIVE_PATH);
  const json: unknown = JSON.parse(readFileSync(seedPath, 'utf-8'));
  if (!isRecord(json) || !Array.isArray(json.nodes) || !Array.isArray(json.edges)) {
    throw new Error('Seed JSON inválido: esperado { nodes: [], edges: [] }');
  }
  const graph: RawApmGraph = {
    checklists: [],
    checklistItems: [],
    measurements: [],
    assets: [],
    users: [],
    checklistItemEdges: [],
    measurementEdges: [],
  };

  for (const rawNode of json.nodes) {
    const node = bundleNodeToSdk(rawNode);
    if (!node) continue;
    switch (bundleViewExternalId(rawNode)) {
      case 'Checklist':
        graph.checklists.push(node);
        break;
      case 'ChecklistItem':
        graph.checklistItems.push(node);
        break;
      case 'MeasurementReading':
        graph.measurements.push(node);
        break;
      case 'Asset':
        graph.assets.push(node);
        break;
      case 'CDF_User':
        graph.users.push(node);
        break;
    }
  }

  for (const rawEdge of json.edges) {
    const edge = bundleEdgeToSdk(rawEdge);
    if (!edge) continue;
    const type = bundleEdgeTypeExternalId(rawEdge);
    if (type === 'referenceChecklistItems') graph.checklistItemEdges.push(edge);
    else if (type === 'referenceMeasurements') graph.measurementEdges.push(edge);
  }

  return graph;
}

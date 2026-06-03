/**
 * Service de LEITURA do domínio APM no space `cognite-flows-grupo-3`.
 *
 * API pública por entidade; cada método devolve o domínio NORMALIZADO (Checklist com
 * `items[]`/`measurements[]` resolvidos via edges, refs materializadas). Compõe a porta
 * `ChecklistDataGateway` (busca crua) + `apm-mapper` (transformação pura) — sem conhecer
 * o SDK (Dependency Inversion). A composição com o adapter concreto vive em `index.ts`.
 */

import type { AssetSummary, CdfUser, Checklist, ChecklistItem, MeasurementReading } from '../../types/apm';

import { mapAssets, mapChecklistItems, mapChecklists, mapMeasurementReadings, mapUsers } from './apm-mapper';
import type { ChecklistDataGateway } from './checklist-data-gateway';
import { EDGE_REFERENCE_CHECKLIST_ITEMS, EDGE_REFERENCE_MEASUREMENTS } from './model-ids';

export interface Group3DataService {
  /** Rondas com itens e medições aninhados e refs resolvidas. */
  getChecklists(): Promise<Checklist[]>;
  /** Tarefas com medições aninhadas e refs (asset/usuários) resolvidas. */
  getChecklistItems(): Promise<ChecklistItem[]>;
  getMeasurementReadings(): Promise<MeasurementReading[]>;
  getAssets(): Promise<AssetSummary[]>;
  getUsers(): Promise<CdfUser[]>;
}

export class ApmGroup3DataService implements Group3DataService {
  private readonly gateway: ChecklistDataGateway;

  constructor(gateway: ChecklistDataGateway) {
    this.gateway = gateway;
  }

  async getChecklists(): Promise<Checklist[]> {
    const [checklists, checklistItems, measurements, assets, users, checklistItemEdges, measurementEdges] =
      await Promise.all([
        this.gateway.listChecklistNodes(),
        this.gateway.listChecklistItemNodes(),
        this.gateway.listMeasurementReadingNodes(),
        this.gateway.listAssetNodes(),
        this.gateway.listCdfUserNodes(),
        this.gateway.listEdges(EDGE_REFERENCE_CHECKLIST_ITEMS),
        this.gateway.listEdges(EDGE_REFERENCE_MEASUREMENTS),
      ]);
    return mapChecklists({
      checklists,
      checklistItems,
      measurements,
      assets,
      users,
      checklistItemEdges,
      measurementEdges,
    });
  }

  async getChecklistItems(): Promise<ChecklistItem[]> {
    const [checklistItems, measurements, assets, users, measurementEdges] = await Promise.all([
      this.gateway.listChecklistItemNodes(),
      this.gateway.listMeasurementReadingNodes(),
      this.gateway.listAssetNodes(),
      this.gateway.listCdfUserNodes(),
      this.gateway.listEdges(EDGE_REFERENCE_MEASUREMENTS),
    ]);
    return mapChecklistItems({ checklistItems, measurements, assets, users, measurementEdges });
  }

  async getMeasurementReadings(): Promise<MeasurementReading[]> {
    return mapMeasurementReadings(await this.gateway.listMeasurementReadingNodes());
  }

  async getAssets(): Promise<AssetSummary[]> {
    return mapAssets(await this.gateway.listAssetNodes());
  }

  async getUsers(): Promise<CdfUser[]> {
    return mapUsers(await this.gateway.listCdfUserNodes());
  }
}

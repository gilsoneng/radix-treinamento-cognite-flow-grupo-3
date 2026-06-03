/**
 * Composition root + barrel da feature group3.
 *
 * `createGroup3DataService` é o ÚNICO ponto que conhece a implementação concreta do
 * gateway — espelha o `injectors/container.py` do seed. O hook futuro consome o
 * `CogniteClient` de `useCogniteSdk()` e chama este factory para obter o service.
 */

import { CogniteChecklistDataGateway } from './cognite-checklist-data-gateway';
import type { InstancesClient } from './cognite-checklist-data-gateway';
import { ApmGroup3DataService } from './group3-data-service';
import type { Group3DataService } from './group3-data-service';

export type { ChecklistDataGateway } from './checklist-data-gateway';
export type { InstancesClient } from './cognite-checklist-data-gateway';
export type { Group3DataService } from './group3-data-service';
export { ApmGroup3DataService } from './group3-data-service';

/**
 * Monta o service de leitura do grupo-3 a partir de um `CogniteClient` autenticado
 * (o tipo é a fatia narrow `InstancesClient`, que o `CogniteClient` de `useCogniteSdk()`
 * satisfaz estruturalmente).
 */
export function createGroup3DataService(client: InstancesClient): Group3DataService {
  return new ApmGroup3DataService(new CogniteChecklistDataGateway(client));
}

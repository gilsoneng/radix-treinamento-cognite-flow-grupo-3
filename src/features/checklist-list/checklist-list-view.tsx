/**
 * Visão "Lista": barra de filtros + tabela de rondas + drawer de detalhe (FR-003/007).
 * Composição pura; cada peça consome seu próprio ViewModel. Os filtros são compartilhados
 * com o dashboard via estado host-synced, então o recorte é o mesmo nas duas visões.
 */

import { ChecklistDetailDrawer } from '../checklist-detail/checklist-detail-drawer';
import { FiltersBar } from '../filters/filters-bar';

import { ChecklistTable } from './checklist-table';

export function ChecklistListView() {
  return (
    <div className="flex flex-col gap-4">
      <FiltersBar />
      <ChecklistTable />
      <ChecklistDetailDrawer />
    </div>
  );
}

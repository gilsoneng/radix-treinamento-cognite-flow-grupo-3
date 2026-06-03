/**
 * Linha de tarefa (ChecklistItem) no detalhe (FR-007): status individual, ativo e medições
 * quando houver. Só renderiza a partir do `ChecklistItemRowView` (já derivado pelo VM).
 */

import type { MeasurementReading } from '../../types/apm';
import { ItemStatusBadge } from '../shared/badges';

import type { ChecklistItemRowView } from './use-checklist-detail-view-model';

function measurementSummary(measurement: MeasurementReading): string {
  if (measurement.options && measurement.options.length > 0) {
    return measurement.options.map((option) => option.label).join(' / ');
  }
  if (measurement.min !== null || measurement.max !== null) {
    return `${measurement.min ?? '—'} a ${measurement.max ?? '—'}`;
  }
  return measurement.type ?? '—';
}

export function ChecklistItemRow({ row }: { row: ChecklistItemRowView }) {
  return (
    <li className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-foreground">{row.title}</span>
        <ItemStatusBadge bucket={row.statusBucket} />
      </div>
      {row.assetLabel !== null && (
        <p className="mt-1 text-sm text-muted-foreground">Ativo: {row.assetLabel}</p>
      )}
      {row.measurements.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 border-t pt-2 text-sm text-muted-foreground">
          {row.measurements.map((measurement) => (
            <li key={measurement.externalId} className="flex justify-between gap-2">
              <span>{measurement.title ?? 'Medição'}</span>
              <span className="text-foreground">{measurementSummary(measurement)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

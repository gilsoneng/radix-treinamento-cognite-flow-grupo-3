/**
 * Linha de uma tarefa (ChecklistItem) dentro do detalhe da ronda (FR-007).
 *
 * Mostra o status individual classificado pelo domínio, o ativo e as medições quando
 * houver. O Badge sempre usa texto (não só cor).
 */

import { Badge } from '@cognite/aura/components';

import type { ItemStatusBucket } from '../../domain';
import type { ChecklistItem, MeasurementReading } from '../../types/apm';
import { ITEM_STATUS_PRESENTATION } from '../presentation/badge-presentations';

export function ChecklistItemRow({ item, status }: { item: ChecklistItem; status: ItemStatusBucket }) {
  const presentation = ITEM_STATUS_PRESENTATION[status];
  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-foreground">{item.title ?? '(sem título)'}</span>
        <Badge variant={presentation.variant} background>
          {presentation.label}
        </Badge>
      </div>
      <span className="text-sm text-muted-foreground">{item.asset?.title ?? 'Sem ativo'}</span>
      {item.measurements.length > 0 ? (
        <ul className="mt-1 flex flex-col gap-0.5">
          {item.measurements.map((measurement) => (
            <li key={measurement.externalId} className="text-sm text-muted-foreground">
              {formatMeasurement(measurement)}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function formatMeasurement(measurement: MeasurementReading): string {
  const name = measurement.title ?? 'Medição';
  const range =
    measurement.min !== null || measurement.max !== null
      ? ` (${measurement.min ?? '-'} a ${measurement.max ?? '-'})`
      : '';
  return measurement.type ? `${name} · ${measurement.type}${range}` : `${name}${range}`;
}

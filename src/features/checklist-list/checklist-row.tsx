/**
 * Linha da tabela de Checklists (FR-003/004/005).
 *
 * Renderiza as colunas mínimas e destaca rondas atrasadas (badge + ícone + texto e linha
 * diferenciada). O título é um botão acessível que seleciona a ronda (abre o detalhe).
 */

import { Badge } from '@cognite/aura/components';

import type { StatusBucket } from '../contracts';
import {
  CHECKLIST_STATUS_PRESENTATION,
  PRIORITY_PRESENTATION,
} from '../presentation/badge-presentations';

import { OverdueBadge } from './overdue-badge';
import type { ChecklistRowVM } from './use-checklist-list-view-model';

interface ChecklistRowProps {
  row: ChecklistRowVM;
  selected: boolean;
  onSelect(id: string): void;
}

export function ChecklistRow({ row, selected, onSelect }: ChecklistRowProps) {
  const priority = PRIORITY_PRESENTATION[row.priority];
  return (
    <tr
      aria-selected={selected}
      data-overdue={row.isOverdue || undefined}
      className="border-b border-border last:border-0 data-[overdue]:bg-error/5 aria-selected:bg-accent/60"
    >
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => onSelect(row.id)}
          className="text-left font-medium text-foreground underline-offset-2 hover:underline"
        >
          {row.title}
        </button>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{row.assignedTo || '—'}</td>
      <td className="px-3 py-2">{row.status === 'atrasado' ? <OverdueBadge /> : <StatusBadge status={row.status} />}</td>
      <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatPrazo(row.endTime)}</td>
      <td className="px-3 py-2">
        <Badge variant={priority.variant} background>
          {priority.label}
        </Badge>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{row.area ?? '—'}</td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Exclude<StatusBucket, 'atrasado'> }) {
  const meta = CHECKLIST_STATUS_PRESENTATION[status];
  const StatusIcon = meta.icon;
  if (StatusIcon === undefined) {
    return (
      <Badge variant={meta.variant} background>
        {meta.label}
      </Badge>
    );
  }
  return (
    <Badge variant={meta.variant} background className="gap-1">
      <StatusIcon aria-hidden className="size-3.5" />
      {meta.label}
    </Badge>
  );
}

function formatPrazo(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

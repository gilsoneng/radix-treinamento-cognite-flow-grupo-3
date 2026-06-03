/**
 * Badges de status/prioridade (FR-005). Sempre TEXTO (+ ícone nos críticos), nunca só cor —
 * acessibilidade conforme `specs/design.md`. Usa o `Badge` da Aura com variantes da marca.
 */

import { Badge } from '@cognite/aura/components';
import { IconAlertTriangle, IconBan, IconCircleCheck } from '@tabler/icons-react';
import type { ComponentProps } from 'react';

import type { ItemStatusBucket, Priority, StatusBucket } from '../../domain';

import { ITEM_STATUS_LABELS, PRIORITY_LABELS, STATUS_LABELS } from './labels';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const STATUS_VARIANT: Record<StatusBucket, BadgeVariant> = {
  atrasado: 'error',
  aberto: 'mountain',
  em_andamento: 'inProgress',
  concluido: 'success',
};

export function StatusBadge({ bucket }: { bucket: StatusBucket }) {
  return (
    <Badge variant={STATUS_VARIANT[bucket]} background>
      {bucket === 'atrasado' && <IconAlertTriangle aria-hidden className="size-3.5" />}
      {bucket === 'concluido' && <IconCircleCheck aria-hidden className="size-3.5" />}
      {STATUS_LABELS[bucket]}
    </Badge>
  );
}

const PRIORITY_VARIANT: Record<Priority, BadgeVariant> = {
  alta: 'orange',
  media: 'sky',
  baixa: 'gray',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} background>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const ITEM_STATUS_VARIANT: Record<ItemStatusBucket, BadgeVariant> = {
  ok: 'success',
  not_ok: 'error',
  blocked: 'warning',
  pendente: 'mountain',
  em_andamento: 'inProgress',
  concluido: 'success',
};

export function ItemStatusBadge({ bucket }: { bucket: ItemStatusBucket }) {
  return (
    <Badge variant={ITEM_STATUS_VARIANT[bucket]} background>
      {bucket === 'not_ok' && <IconAlertTriangle aria-hidden className="size-3.5" />}
      {bucket === 'blocked' && <IconBan aria-hidden className="size-3.5" />}
      {ITEM_STATUS_LABELS[bucket]}
    </Badge>
  );
}

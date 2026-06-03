import { IconAlertTriangle, IconCircle, IconCircleCheck, IconProgress } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

import type { ItemStatusBucket, Priority, StatusBucket } from '../../domain';

export type StatusBadgeVariant = 'gray' | 'inProgress' | 'success' | 'error' | 'warning';

export interface BadgePresentation {
  label: string;
  variant: StatusBadgeVariant;
  icon?: Icon;
}

export const CHECKLIST_STATUS_PRESENTATION: Record<StatusBucket, BadgePresentation> = {
  aberto: { label: 'Aberto', variant: 'gray', icon: IconCircle },
  em_andamento: { label: 'Em andamento', variant: 'inProgress', icon: IconProgress },
  atrasado: { label: 'Atrasado', variant: 'error', icon: IconAlertTriangle },
  concluido: { label: 'Concluído', variant: 'success', icon: IconCircleCheck },
};

export const PRIORITY_PRESENTATION: Record<Priority, BadgePresentation> = {
  alta: { label: 'Alta', variant: 'error' },
  media: { label: 'Média', variant: 'warning' },
  baixa: { label: 'Baixa', variant: 'gray' },
};

export const ITEM_STATUS_PRESENTATION: Record<ItemStatusBucket, BadgePresentation> = {
  ok: { label: 'OK', variant: 'success' },
  not_ok: { label: 'Not OK', variant: 'error' },
  blocked: { label: 'Blocked', variant: 'error' },
  em_andamento: { label: 'Em andamento', variant: 'inProgress' },
  concluido: { label: 'Concluído', variant: 'success' },
  pendente: { label: 'Pendente', variant: 'gray' },
};

export function isItemStatusBucket(value: string): value is ItemStatusBucket {
  return value in ITEM_STATUS_PRESENTATION;
}

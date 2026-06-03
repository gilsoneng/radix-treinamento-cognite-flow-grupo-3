/**
 * Rótulos PT-BR e mapeamentos de apresentação compartilhados (DRY) entre filtros,
 * dashboard, tabela e detalhe. Mantém a tradução do vocabulário de domínio num só lugar.
 */

import type { ItemStatusBucket , Period, Priority, StatusBucket } from '../../domain';

export const STATUS_LABELS: Record<StatusBucket, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  atrasado: 'Atrasado',
  concluido: 'Concluído',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período',
};

export const ITEM_STATUS_LABELS: Record<ItemStatusBucket, string> = {
  ok: 'OK',
  not_ok: 'Not OK',
  blocked: 'Bloqueado',
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

/** Ordem de exibição dos baldes de status (do mais urgente ao concluído). */
export const STATUS_ORDER: readonly StatusBucket[] = ['atrasado', 'aberto', 'em_andamento', 'concluido'];
export const PRIORITY_ORDER: readonly Priority[] = ['alta', 'media', 'baixa'];
export const PERIOD_ORDER: readonly Period[] = ['7d', '30d', '90d', 'all'];

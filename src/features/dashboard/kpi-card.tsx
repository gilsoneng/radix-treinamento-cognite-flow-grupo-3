/**
 * Card de KPI (FR-002). Componente puro. Acento opcional (ex.: "atrasados") combina cor
 * COM ícone + texto — nunca só cor (acessibilidade, `specs/design.md`).
 */

import { Card, CardContent } from '@cognite/aura/components';
import type { ReactNode } from 'react';

export type KpiAccent = 'neutral' | 'danger' | 'success' | 'info';

const ACCENT_BAR: Record<KpiAccent, string> = {
  neutral: 'bg-border',
  danger: 'bg-[var(--warning-foreground)]',
  success: 'bg-[var(--success-foreground)]',
  info: 'bg-[var(--info-foreground)]',
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: KpiAccent;
}

export function KpiCard({ label, value, hint, icon, accent = 'neutral' }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${ACCENT_BAR[accent]}`} aria-hidden />
        <CardContent className="flex-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {icon}
            <span>{label}</span>
          </div>
          <div className="mt-1 text-3xl font-semibold text-foreground">{value}</div>
          {hint !== undefined && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </CardContent>
      </div>
    </Card>
  );
}

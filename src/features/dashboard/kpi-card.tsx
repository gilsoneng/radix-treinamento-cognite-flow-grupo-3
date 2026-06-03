import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components';
import type { ReactNode } from 'react';

export type KpiCardVariant = 'default' | 'overdue';

export interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: KpiCardVariant;
  emphasisLabel?: string;
  icon?: ReactNode;
}

export function KpiCard({
  title,
  value,
  description,
  variant = 'default',
  emphasisLabel,
  icon,
}: KpiCardProps) {
  const showEmphasis = variant === 'overdue' && (emphasisLabel !== undefined || icon !== undefined);

  return (
    <Card role="status" aria-label={title}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle as="h3">{title}</CardTitle>
          {showEmphasis ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              {icon}
              {emphasisLabel !== undefined ? (
                <Badge variant="mountain" background>
                  {emphasisLabel}
                </Badge>
              ) : null}
            </span>
          ) : null}
        </div>
        {description !== undefined ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

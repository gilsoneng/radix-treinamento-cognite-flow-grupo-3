/**
 * Distribuição (por status / prioridade / área) — FR-002 (d)(e). Barras proporcionais com
 * o número sempre visível em texto (acessível). Aura não tem gráfico de barras; usamos
 * markup padrão estilizado com tokens da marca (track `bg-muted`, preenchimento `bg-primary`).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@cognite/aura/components';

export interface DistributionEntry {
  label: string;
  count: number;
}

export interface DistributionListProps {
  title: string;
  entries: DistributionEntry[];
  emptyLabel?: string;
}

export function DistributionList({ title, entries, emptyLabel = 'Sem dados' }: DistributionListProps) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => {
              const pct = total === 0 ? 0 : Math.round((entry.count / total) * 100);
              return (
                <li key={entry.label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm text-foreground" title={entry.label}>
                    {entry.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {entry.count} ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

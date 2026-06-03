/**
 * Seletor da escala VISUAL do gráfico temporal: 7 dias / 30 dias / 12 meses (FR-005).
 *
 * Mesma abordagem do `ViewSwitcher`: Aura não tem segmented control, então compomos com
 * `Button` (Aura) + `aria-pressed` (estado não comunicado só por cor). A escala é host-synced;
 * o componente só recebe o valor atual e emite a troca.
 */

import { Button } from '@cognite/aura/components';

import type { ChartScale } from '../../domain';

export interface ChartScaleSelectorProps {
  scale: ChartScale;
  onChange(scale: ChartScale): void;
}

const OPTIONS: { scale: ChartScale; label: string }[] = [
  { scale: '7d', label: '7 dias' },
  { scale: '30d', label: '30 dias' },
  { scale: '12m', label: '12 meses' },
];

export function ChartScaleSelector({ scale, onChange }: ChartScaleSelectorProps) {
  return (
    <div role="group" aria-label="Escala do gráfico temporal" className="inline-flex items-center gap-1 rounded-md border p-1">
      {OPTIONS.map(({ scale: value, label }) => {
        const active = value === scale;
        return (
          <Button
            key={value}
            variant={active ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={active}
            onClick={() => onChange(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

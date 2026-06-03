/**
 * Painel de drill-down dos ASSETS de uma seleção do gráfico (FR-010/011).
 *
 * Mostra qual recorte está ativo ("Not Ok em 15/05"), os ativos por trás daquele ponto/barra
 * (via `item.asset`) com contagem, e a ação "Limpar seleção". Visível só quando há seleção.
 */

import { Badge, Button } from '@cognite/aura/components';
import { IconX } from '@tabler/icons-react';

import type { AssetDrillRow, ChartSelection } from '../../domain';

import { resultLabel } from './chart-style';

export interface AssetDrilldownPanelProps {
  selection: ChartSelection;
  assets: AssetDrillRow[];
  onClear(): void;
}

export function AssetDrilldownPanel({ selection, assets, onClear }: AssetDrilldownPanelProps) {
  const totalItems = assets.reduce((sum, asset) => sum + asset.count, 0);

  return (
    <section aria-label="Ativos da seleção" className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Ativos de <span className="font-semibold">{resultLabel(selection.result)}</span> em{' '}
            <span className="font-semibold">{selection.binLabel}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'} em {assets.length}{' '}
            {assets.length === 1 ? 'ativo' : 'ativos'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          <IconX aria-hidden className="size-4" />
          Limpar seleção
        </Button>
      </div>

      {assets.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum ativo para esta seleção.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {assets.map((asset) => (
            <li key={asset.externalId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-foreground" title={asset.externalId}>
                {asset.title}
              </span>
              <Badge variant="nordic" background>
                {asset.count} {asset.count === 1 ? 'item' : 'itens'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

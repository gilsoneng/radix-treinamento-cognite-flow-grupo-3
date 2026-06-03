import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cognite/aura/components';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

import type { SortDir, SortKey } from '../../domain';

const SORT_KEY_LABELS: Record<SortKey, string> = {
  prazo: 'Prazo',
  status: 'Status',
};

export interface SortControlProps {
  sort: { key: SortKey; dir: SortDir };
  onSortChange(s: { key: SortKey; dir: SortDir }): void;
}

export function SortControl({ sort, onSortChange }: SortControlProps) {
  const toggleDir = (): void => {
    onSortChange({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-[10rem] flex-col gap-1">
        <Label htmlFor="sort-key">Ordenar por</Label>
        <Select
          value={sort.key}
          onValueChange={(key: string) => {
            if (key === 'prazo' || key === 'status') {
              onSortChange({ key, dir: sort.dir });
            }
          }}
        >
          <SelectTrigger id="sort-key" className="w-full">
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prazo">{SORT_KEY_LABELS.prazo}</SelectItem>
            <SelectItem value="status">{SORT_KEY_LABELS.status}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={toggleDir}
        aria-label={sort.dir === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
      >
        {sort.dir === 'asc' ? (
          <IconArrowUp aria-hidden className="size-4" />
        ) : (
          <IconArrowDown aria-hidden className="size-4" />
        )}
        <span>{sort.dir === 'asc' ? 'Crescente' : 'Decrescente'}</span>
      </Button>
    </div>
  );
}

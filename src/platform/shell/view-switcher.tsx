/**
 * Alterna a visão ativa (Dashboard ⇄ Lista). A visão ativa é estado HOST-SYNCED (FR-011):
 * o componente só recebe o valor atual e emite a troca; quem persiste é o `AppStateProvider`.
 *
 * Aura não tem um "segmented control" dedicado; compomos com `Button` (Aura) + `aria-pressed`
 * para acessibilidade (estado não comunicado só por cor). Quando a Aura não cobre, caímos
 * para markup padrão estilizado com tokens da marca.
 */

import { Button } from '@cognite/aura/components';
import { IconLayoutDashboard, IconList } from '@tabler/icons-react';

import type { ActiveView } from '../state/app-state';

export interface ViewSwitcherProps {
  active: ActiveView;
  onChange: (view: ActiveView) => void;
}

const OPTIONS: { view: ActiveView; label: string; Icon: typeof IconList }[] = [
  { view: 'dashboard', label: 'Dashboard', Icon: IconLayoutDashboard },
  { view: 'list', label: 'Lista', Icon: IconList },
];

export function ViewSwitcher({ active, onChange }: ViewSwitcherProps) {
  return (
    <div role="group" aria-label="Trocar visão" className="inline-flex items-center gap-1 rounded-md border p-1">
      {OPTIONS.map(({ view, label, Icon }) => {
        const isActive = view === active;
        return (
          <Button
            key={view}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={isActive}
            onClick={() => onChange(view)}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

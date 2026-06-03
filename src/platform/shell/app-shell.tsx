/**
 * Shell do app: o "esqueleto" onde as features (DEV 3/DEV 4) vivem.
 *
 * Container fino — apenas LIGA a store de estado host-synced (`useAppState`) e a fonte de
 * dados (`useChecklistData`) ao layout. Nada de regra de negócio aqui (essa é da DEV 2/3/4);
 * nada de estado local que decida o que o usuário vê (esse mora na store — CLAUDE.md §2/§5).
 *
 * Layout 100% Aura + tokens semânticos da marca (`bg-background`, `bg-card`, `border`,
 * `text-muted-foreground`), que o `brand-theme.css` mapeia a partir de `specs/design.md`.
 */

import { useChecklistData } from '../data/use-checklist-data';
import { useAppState } from '../state/use-app-state';

import { LastUpdated } from './last-updated';
import { ShellContent } from './shell-content';
import { ViewSwitcher } from './view-switcher';

export function AppShell() {
  const { state, setActiveView } = useAppState();
  const { checklists, isLoading, isRefreshing, isError, error, lastUpdatedAt, refresh } = useChecklistData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Action Items de Chão de Fábrica</h1>
            <p className="text-sm text-muted-foreground">
              Status das rondas e tarefas em quase tempo real — somente leitura.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewSwitcher active={state.activeView} onChange={setActiveView} />
            <LastUpdated lastUpdatedAt={lastUpdatedAt} isRefreshing={isRefreshing} onRefresh={refresh} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl px-6 py-6">
        <ShellContent
          activeView={state.activeView}
          isLoading={isLoading}
          isError={isError}
          error={error}
          checklistCount={checklists.length}
        />
      </main>
    </div>
  );
}

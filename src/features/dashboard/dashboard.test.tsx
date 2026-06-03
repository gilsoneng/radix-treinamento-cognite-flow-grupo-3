import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { makeAppState } from '../../__mocks__/app-state';
import { makeChecklist } from '../../__mocks__/checklist';
import { makeChecklistDataSource } from '../../__mocks__/checklist-data';
import type { AppStateContextValue } from '../../platform';
import type { Checklist } from '../../types/apm';
import { FiltersViewModelContext } from '../filters/use-filters-view-model';

import { DashboardView } from './dashboard';
import { DashboardViewModelContext } from './use-dashboard-view-model';

const NOW = Date.UTC(2026, 5, 3);

function renderDashboard(checklists: Checklist[], appState: AppStateContextValue) {
  const data = () => makeChecklistDataSource({ checklists });
  const state = () => appState;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DashboardViewModelContext.Provider value={{ useChecklistData: data, useAppState: state, now: () => NOW }}>
      <FiltersViewModelContext.Provider value={{ useChecklistData: data, useAppState: state, now: () => NOW }}>
        {children}
      </FiltersViewModelContext.Provider>
    </DashboardViewModelContext.Provider>
  );
  return render(<DashboardView />, { wrapper });
}

describe('DashboardView', () => {
  it('renderiza os cards de KPI e as distribuições', () => {
    const checklists = [
      makeChecklist({ externalId: 'atrasada', status: 'To Do', endTime: '2020-01-01T00:00:00.000Z' }),
      makeChecklist({ externalId: 'andamento', status: 'Ongoing', endTime: '2030-01-01T00:00:00.000Z' }),
    ];
    renderDashboard(checklists, makeAppState());

    expect(screen.getByText('Rondas atrasadas')).toBeInTheDocument();
    expect(screen.getByText('No prazo (SLA)')).toBeInTheDocument();
    expect(screen.getByText('Por status')).toBeInTheDocument();
    expect(screen.getByText('Por prioridade')).toBeInTheDocument();
    expect(screen.getByText('Por área')).toBeInTheDocument();
  });

  it('mostra aviso de "nenhuma ronda" quando o filtro não casa', () => {
    const checklists = [makeChecklist({ externalId: 'andamento', status: 'Ongoing', endTime: '2030-01-01T00:00:00.000Z' })];
    // Filtro só-atrasados sem rondas atrasadas → recorte vazio.
    const appState = makeAppState({ filters: { status: [], onlyOverdue: true, priority: [], area: [], period: 'all' } });
    renderDashboard(checklists, appState);

    expect(screen.getByText(/Nenhuma ronda corresponde aos filtros/)).toBeInTheDocument();
  });
});

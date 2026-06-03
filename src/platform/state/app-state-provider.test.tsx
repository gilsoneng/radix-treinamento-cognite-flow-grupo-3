import type { HostAppAPI } from '@cognite/app-sdk';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeHostAppApi } from '../../__mocks__/host-app-api';
import { HostAppApiContext } from '../host/host-app-api-context';

import { parseAppState, serializeAppState } from './app-state';
import { AppStateProvider } from './app-state-provider';
import { useAppState } from './use-app-state';

function renderAppState(api: HostAppAPI, initialState?: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <HostAppApiContext.Provider value={{ api, initialState }}>
      <AppStateProvider>{children}</AppStateProvider>
    </HostAppApiContext.Provider>
  );
  return renderHook(() => useAppState(), { wrapper });
}

describe('AppStateProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('faz seed do estado a partir do initialState do host', () => {
    // Arrange
    const initial = serializeAppState({
      ...parseAppState(undefined),
      activeView: 'list',
      search: 'compressor',
    });

    // Act
    const { result } = renderAppState(makeHostAppApi(), initial);

    // Assert
    expect(result.current.state.activeView).toBe('list');
    expect(result.current.state.search).toBe('compressor');
  });

  it('cada setter atualiza o estado E espelha no host com o JSON serializado', () => {
    // Arrange
    const api = makeHostAppApi();
    const { result } = renderAppState(api);

    // Act
    act(() => result.current.setActiveView('list'));

    // Assert — estado local mudou
    expect(result.current.state.activeView).toBe('list');
    // ...e o host recebeu o estado serializado correspondente
    expect(api.syncInternalState).toHaveBeenCalledTimes(1);
    const pushed = vi.mocked(api.syncInternalState).mock.calls[0]?.[0];
    expect(parseAppState(pushed).activeView).toBe('list');
  });

  it('selectChecklist seleciona a ronda e abre o detalhe (FR-007)', () => {
    const api = makeHostAppApi();
    const { result } = renderAppState(api);

    act(() => result.current.selectChecklist('checklist-9'));

    expect(result.current.state.selectedChecklistId).toBe('checklist-9');
    expect(result.current.state.detailOpen).toBe(true);
  });

  it('closeDetail fecha o detalhe mantendo a seleção', () => {
    const api = makeHostAppApi();
    const { result } = renderAppState(api);

    act(() => result.current.selectChecklist('checklist-9'));
    act(() => result.current.closeDetail());

    expect(result.current.state.selectedChecklistId).toBe('checklist-9');
    expect(result.current.state.detailOpen).toBe(false);
  });

  it('não quebra a UI se o host rejeitar o sync (fire-and-forget)', async () => {
    // Arrange — syncInternalState rejeita
    const api = makeHostAppApi({
      syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.reject(new Error('host offline'))),
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderAppState(api);

    // Act
    act(() => result.current.setSearch('x'));

    // Assert — o estado local ainda avança apesar da falha de sync
    expect(result.current.state.search).toBe('x');
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });
});

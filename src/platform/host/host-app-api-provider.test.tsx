import type { ConnectToHostAppResult } from '@cognite/app-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeHostAppApi } from '../../__mocks__/host-app-api';

import { HostAppApiProvider } from './host-app-api-provider';
import { useHostAppApi } from './use-host-app-api';

type ConnectFn = NonNullable<Parameters<typeof HostAppApiProvider>[0]['connectToHostApp']>;

function Probe() {
  const { api, initialState } = useHostAppApi();
  return (
    <div>
      <span>projeto-pronto:{String(typeof api.getProject === 'function')}</span>
      <span>initial:{initialState ?? 'vazio'}</span>
    </div>
  );
}

describe('HostAppApiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o estado de carregamento enquanto conecta', () => {
    // Arrange — connect que nunca resolve
    const connect = vi.fn<ConnectFn>(() => new Promise<ConnectToHostAppResult>(() => undefined));

    // Act
    render(
      <HostAppApiProvider connectToHostApp={connect}>
        <Probe />
      </HostAppApiProvider>
    );

    // Assert
    expect(screen.getByText('Conectando ao Fusion…')).toBeInTheDocument();
  });

  it('provê api + initialState aos filhos quando conecta', async () => {
    // Arrange
    const connect = vi.fn<ConnectFn>(() =>
      Promise.resolve({ api: makeHostAppApi(), initialState: 'estado-do-host' })
    );

    // Act
    render(
      <HostAppApiProvider connectToHostApp={connect}>
        <Probe />
      </HostAppApiProvider>
    );

    // Assert
    await waitFor(() => expect(screen.getByText('projeto-pronto:true')).toBeInTheDocument());
    expect(screen.getByText('initial:estado-do-host')).toBeInTheDocument();
    expect(connect).toHaveBeenCalledWith({ applicationName: 'xpto-app' });
  });

  it('mostra o estado de erro quando o handshake falha', async () => {
    // Arrange
    const connect = vi.fn<ConnectFn>(() => Promise.reject(new Error('handshake recusado')));

    // Act
    render(
      <HostAppApiProvider connectToHostApp={connect}>
        <Probe />
      </HostAppApiProvider>
    );

    // Assert
    await waitFor(() => expect(screen.getByText('handshake recusado')).toBeInTheDocument());
  });
});

describe('useHostAppApi', () => {
  it('lança erro claro quando usado fora do provider', () => {
    // Silencia o console de erro esperado do React ao propagar a exceção.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Orphan() {
      useHostAppApi();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('useHostAppApi deve ser usado dentro de <HostAppApiProvider>.');
    consoleError.mockRestore();
  });
});

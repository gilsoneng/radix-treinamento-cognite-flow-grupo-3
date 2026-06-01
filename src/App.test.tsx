import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostAppAPI, ConnectToHostAppResult } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import type { ComponentProps } from 'react';

import App from './App';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

function makeApi(): HostAppAPI {
  return {
    getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('radix-dev')),
    getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
    getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
    getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
    navigateInternal: vi.fn<HostAppAPI['navigateInternal']>(() => Promise.resolve(true)),
    navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)),
    registerAgentServer: vi.fn<HostAppAPI['registerAgentServer']>(() => Promise.resolve()),
    unregisterAgentServer: vi.fn<HostAppAPI['unregisterAgentServer']>(() => Promise.resolve()),
    sendAgentLayoutMode: vi.fn<HostAppAPI['sendAgentLayoutMode']>(() => Promise.resolve()),
    sendAgentMessage: vi.fn<HostAppAPI['sendAgentMessage']>(() => Promise.resolve()),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => new Promise<ConnectToHostAppResult>(() => undefined)),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeConnectedDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => Promise.resolve({ api: makeApi() })),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<App deps={makeLoadingDeps()} />);
    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders splash with deployment targets and checklist copy', async () => {
    render(<App deps={makeConnectedDeps()} />);
    await waitFor(() => expect(screen.getByText('Welcome to Flows custom apps')).toBeInTheDocument());
    expect(screen.getByText('App deployment checklist')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Deploy')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Help & feedback')).toBeInTheDocument();
    expect(screen.getByText('Your app will deploy to')).toBeInTheDocument();
    expect(screen.getByText('org')).toBeInTheDocument();
    expect(screen.getByText('and project')).toBeInTheDocument();
    expect(screen.getByText('radix')).toBeInTheDocument();
    expect(screen.getByText('radix-dev')).toBeInTheDocument();
    expect(screen.getAllByText(/SPEC\.md/).length).toBeGreaterThan(0);
    expect(screen.getByText(/apps deploy --interactive/)).toBeInTheDocument();
  });
});

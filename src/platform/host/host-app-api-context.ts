/**
 * Contexto que carrega a `HostAppAPI` (RPC com o host Fusion) e o `initialState`
 * extraído da URL nesta carga. É a "porta" de injeção (DI, CLAUDE.md §3): quem precisa
 * do host depende DESTE contexto, nunca de `window`/globais nem de um `connectToHostApp`
 * importado direto.
 *
 * Valor `null` = fora do `HostAppApiProvider` (erro de composição); `useHostAppApi`
 * transforma isso numa mensagem clara em vez de um crash silencioso.
 */

import type { HostAppAPI } from '@cognite/app-sdk';
import { createContext } from 'react';

export interface HostAppApiContextValue {
  /** API do host (syncInternalState, navigate*, getProject, ...). */
  api: HostAppAPI;
  /** String de estado que o host extraiu da URL nesta carga (undefined no primeiro acesso). */
  initialState: string | undefined;
}

export const HostAppApiContext = createContext<HostAppApiContextValue | null>(null);

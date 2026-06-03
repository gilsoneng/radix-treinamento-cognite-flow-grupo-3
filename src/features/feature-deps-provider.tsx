/**
 * Provider de injeção das dependências de DEV 1/2 para a árvore de DEV 4.
 *
 * As dependências reais já são os defaults (`src/platform` + `src/domain`). O provider fica
 * disponível para testes e para futuras substituições explícitas em integrações.
 */

import type { ReactNode } from 'react';

import { DEFAULT_FEATURE_DEPS, FeatureDepsContext } from './feature-deps';
import type { FeatureDeps } from './feature-deps';

interface FeatureDepsProviderProps {
  deps: Partial<FeatureDeps>;
  children: ReactNode;
}

export function FeatureDepsProvider({ deps, children }: FeatureDepsProviderProps) {
  const value: FeatureDeps = { ...DEFAULT_FEATURE_DEPS, ...deps };
  return <FeatureDepsContext.Provider value={value}>{children}</FeatureDepsContext.Provider>;
}

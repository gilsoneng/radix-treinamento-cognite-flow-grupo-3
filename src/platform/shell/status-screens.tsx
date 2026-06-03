/**
 * Telas de status reutilizáveis (carregando / erro / vazio) montadas com componentes
 * Aura e tokens semânticos da marca (`bg-background`, `text-muted-foreground`, ...),
 * que o `brand-theme.css` já mapeia a partir de `specs/design.md`. Centraliza o visual
 * desses estados (DRY) para host provider, fallbacks do App e shell (FR-012).
 */

import { Alert, AlertDescription, AlertTitle, Card, CardContent, Loader } from '@cognite/aura/components';
import type { ReactNode } from 'react';

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/** Estado de carregamento em tela cheia (handshake com host / primeira carga de dados). */
export function LoadingScreen({ message = 'Carregando…' }: { message?: string }) {
  return (
    <CenteredScreen>
      <Card aria-busy="true" aria-live="polite">
        <CardContent>
          <div className="inline-flex items-center gap-3 text-muted-foreground">
            <Loader size={20} />
            <span>{message}</span>
          </div>
        </CardContent>
      </Card>
    </CenteredScreen>
  );
}

/** Estado de erro em tela cheia (falha ao conectar ao host ou consultar o CDF). */
export function ErrorScreen({
  title = 'Não foi possível carregar o painel',
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <CenteredScreen>
      <Alert variant="error" role="alert">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </CenteredScreen>
  );
}

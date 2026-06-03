/**
 * Destaque visual de ronda Atrasada (FR-005).
 *
 * Pareia cor + ícone + texto (nunca só cor), conforme acessibilidade em specs/design.md.
 */

import { Badge } from '@cognite/aura/components';
import { IconAlertTriangle } from '@tabler/icons-react';

export function OverdueBadge() {
  return (
    <Badge variant="error" background className="gap-1">
      <IconAlertTriangle aria-hidden className="size-3.5" />
      Atrasado
    </Badge>
  );
}

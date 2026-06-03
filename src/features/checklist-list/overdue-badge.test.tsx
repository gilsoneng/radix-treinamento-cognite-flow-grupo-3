import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OverdueBadge } from './overdue-badge';

describe(OverdueBadge.name, () => {
  it('mostra o texto "Atrasado" (não depende só de cor)', () => {
    render(<OverdueBadge />);

    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('pareia o texto com um ícone para acessibilidade', () => {
    const { container } = render(<OverdueBadge />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

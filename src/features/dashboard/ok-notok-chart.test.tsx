import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OkNotOkChart } from './ok-notok-chart';

describe('OkNotOkChart', () => {
  it('mostra OK, Not Ok e Outros com os valores e um resumo acessível', () => {
    render(<OkNotOkChart counts={{ ok: 3, notOk: 2, outros: 1, total: 6 }} />);

    // Resumo textual (não depende só de cor, FR-014).
    expect(screen.getByRole('img', { name: /3 OK, 2 Not Ok, 1 outros \(total 6\)/ })).toBeInTheDocument();
    // Rótulos e valores visíveis.
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Not Ok')).toBeInTheDocument();
    expect(screen.getByText('Outros')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

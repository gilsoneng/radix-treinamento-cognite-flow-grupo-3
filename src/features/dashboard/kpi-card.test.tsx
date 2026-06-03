import { IconAlertTriangle } from '@tabler/icons-react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KpiCard } from './kpi-card';

describe(KpiCard.name, () => {
  it('should render title and value', () => {
    render(<KpiCard title="Abertos" value={12} />);
    expect(screen.getByText('Abertos')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<KpiCard title="SLA" value="85%" description="Concluídas no prazo" />);
    expect(screen.getByText('Concluídas no prazo')).toBeInTheDocument();
  });

  it('should render emphasis label and icon for overdue variant', () => {
    render(
      <KpiCard
        title="Atrasados"
        value={3}
        variant="overdue"
        emphasisLabel="Requer atenção"
        icon={<IconAlertTriangle aria-hidden data-testid="overdue-icon" />}
      />
    );
    expect(screen.getByText('Requer atenção')).toBeInTheDocument();
    expect(screen.getByTestId('overdue-icon')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Atrasados');
  });
});

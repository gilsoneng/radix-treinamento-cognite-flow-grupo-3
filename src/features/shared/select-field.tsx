/**
 * Campo de escolha única acessível. A Aura tem `Select` (Base UI, baseado em portal), mas
 * ele exibe o valor cru — não o rótulo — sem fiação extra e é frágil no ambiente de teste.
 * Para um seletor simples e rotulado, um `<select>` nativo é acessível (teclado nativo),
 * testável e mostra os rótulos. Estilizado só com tokens da marca (`specs/design.md`).
 */

import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
}

export function SelectField({ label, value, options, onChange, icon }: SelectFieldProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

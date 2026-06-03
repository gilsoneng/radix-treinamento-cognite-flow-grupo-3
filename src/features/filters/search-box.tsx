import { InputGroup, InputGroupAddon, InputGroupInput } from '@cognite/aura/components';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export interface SearchBoxProps {
  value: string;
  onCommit(query: string): void;
  debounceMs?: number;
  placeholder?: string;
}

export function SearchBox({
  value,
  onCommit,
  debounceMs = 300,
  placeholder = 'Buscar por título ou ativo...',
}: SearchBoxProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draft !== value) {
        onCommit(draft);
      }
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [draft, value, debounceMs, onCommit]);

  return (
    <div className="flex flex-col gap-1">
      <InputGroup>
        <InputGroupAddon>
          <IconSearch aria-hidden className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="checklist-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar por título ou ativo"
        />
      </InputGroup>
    </div>
  );
}

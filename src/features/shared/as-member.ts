/**
 * Converte uma `string` (ex.: vinda de um `<select>`) num membro tipado de um conjunto
 * conhecido, sem `as` (CLAUDE.md §7). Retorna `null` se não pertencer.
 */
export function asMember<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.find((candidate) => candidate === value) ?? null;
}

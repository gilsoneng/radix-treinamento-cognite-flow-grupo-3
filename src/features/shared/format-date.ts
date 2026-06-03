/** Formata uma data ISO para o padrão da planta (pt-BR, sem hora). `null`/inválido → "—". */
export function formatDate(iso: string | null): string {
  if (iso === null || iso === '') return '—';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('pt-BR');
}
